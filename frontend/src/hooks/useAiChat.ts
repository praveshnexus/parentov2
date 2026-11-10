import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

export type AiSource = 'claude' | 'knowledge-base';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  source?: AiSource;
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (childId: string, content: string) => Promise<void>;
  stop: () => void;
  clearHistory: () => void;
}

class StreamError extends Error {}

/** Same refresh endpoint the axios client uses; returns the new access token or null. */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
    const token: string | undefined = data?.data?.accessToken;
    if (token) localStorage.setItem('access_token', token);
    return token ?? null;
  } catch {
    return null;
  }
}

function postChat(childId: string, messages: ChatMessage[], token: string | null, signal: AbortSignal) {
  return fetch(`/api/ai/chat/${childId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      messages: messages
        .filter((m) => m.content.trim())
        .map(({ role, content }) => ({ role, content })),
    }),
    signal,
  });
}

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // Cancel any in-flight request when the page unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const updateLast = (patch: Partial<ChatMessage>) =>
    setMessages((prev) => {
      if (!prev.length || prev[prev.length - 1].role !== 'assistant') return prev;
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], ...patch };
      return next;
    });

  const sendMessage = useCallback(async (childId: string, content: string) => {
    if (abortRef.current) return; // a reply is already streaming

    setError(null);
    const history = [...messagesRef.current.filter((m) => m.content.trim()), { role: 'user' as const, content }];
    setMessages([...history, { role: 'assistant', content: '', isStreaming: true }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let assistantText = '';

    try {
      let response = await postChat(childId, history, localStorage.getItem('access_token'), controller.signal);

      // Access token expired → refresh once and retry (fetch bypasses the axios interceptor).
      if (response.status === 401) {
        const token = await refreshAccessToken();
        if (!token) {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          return;
        }
        response = await postChat(childId, history, token, controller.signal);
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new StreamError(body?.message ?? `Request failed (HTTP ${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new StreamError('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;

      const handleEvent = (event: string, data: string) => {
        let payload: any;
        try {
          payload = JSON.parse(data);
        } catch {
          return; // ignore malformed frames
        }
        if (event === 'chunk' && typeof payload.text === 'string') {
          assistantText += payload.text;
          updateLast({ content: assistantText, isStreaming: true });
        } else if (event === 'done') {
          finished = true;
          assistantText = payload.fullText ?? assistantText;
          updateLast({ content: assistantText, isStreaming: false, source: payload.source });
        } else if (event === 'error') {
          throw new StreamError(payload.message ?? 'The assistant could not answer right now.');
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        let sep: number;
        while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, '');
          let event = 'message';
          const dataLines: string[] = [];
          for (const line of frame.split(/\r?\n/)) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
          }
          if (dataLines.length) handleEvent(event, dataLines.join('\n'));
        }
      }

      if (!finished) {
        if (!assistantText) throw new StreamError('The connection closed before a reply arrived. Please try again.');
        updateLast({ isStreaming: false });
      }
    } catch (err: any) {
      if (controller.signal.aborted) {
        // Stopped by the user: keep whatever already arrived.
        if (assistantText) updateLast({ isStreaming: false });
        else setMessages((prev) => prev.slice(0, -1));
      } else {
        setError(err instanceof StreamError ? err.message : 'Network error. Check your connection and try again.');
        if (assistantText) updateLast({ isStreaming: false });
        else setMessages((prev) => (prev[prev.length - 1]?.role === 'assistant' ? prev.slice(0, -1) : prev));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, error, sendMessage, stop, clearHistory };
}
