import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (childId: string, content: string) => Promise<void>;
  clearHistory: () => void;
}

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const sendMessage = useCallback(async (childId: string, content: string) => {
    if (isStreaming) return;

    setError(null);

    const userMessage: ChatMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];

    // Add user message and placeholder assistant message
    setMessages([...updatedMessages, { role: 'assistant', content: '', isStreaming: true }]);
    setIsStreaming(true);

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`/api/ai/chat/${childId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message ?? `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      // Register abort so component can cancel
      abortRef.current = () => reader.cancel();

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: chunk')) continue;
          if (line.startsWith('event: done')) continue;
          if (line.startsWith('event: error')) continue;
          if (line.startsWith('event: connected')) continue;

          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));

              if (payload.text !== undefined) {
                // Streaming chunk
                assistantText += payload.text;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: 'assistant',
                    content: assistantText,
                    isStreaming: true,
                  };
                  return next;
                });
              } else if (payload.fullText !== undefined) {
                // Done event — finalize
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: 'assistant',
                    content: payload.fullText,
                    isStreaming: false,
                  };
                  return next;
                });
              } else if (payload.message !== undefined) {
                // Error event
                throw new Error(payload.message);
              }
            } catch (parseErr) {
              // Skip malformed JSON lines
            }
          }
        }
      }

      // Ensure last message is finalized (in case done event was missed)
      setMessages((prev) => {
        const next = [...prev];
        if (next[next.length - 1]?.isStreaming) {
          next[next.length - 1] = { ...next[next.length - 1], isStreaming: false };
        }
        return next;
      });
    } catch (err: any) {
      const errMsg = err.message ?? 'Something went wrong';
      setError(errMsg);
      // Remove the streaming placeholder on error
      setMessages((prev) => {
        const next = prev.filter((_, i) => i !== prev.length - 1);
        return next;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming]);

  const clearHistory = useCallback(() => {
    abortRef.current?.();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, error, sendMessage, clearHistory };
}
