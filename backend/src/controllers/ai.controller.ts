import { Request, Response, NextFunction } from 'express';
import { streamAIResponse, loadChildForChat, getChildSummary, getAiStatus, ChatMessage } from '../services/ai.service';
import { ApiResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 2000;

/**
 * Validates and normalises the conversation sent by the client:
 * - roles must be user/assistant and content must be a non-empty string
 * - only the last MAX_HISTORY messages are kept
 * - the history must start with a user message (the Messages API rejects
 *   conversations that start with an assistant turn)
 */
function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new AppError('messages array is required', 400, 'VALIDATION_ERROR');
  }
  const cleaned: ChatMessage[] = [];
  for (const msg of raw) {
    if (!msg || !['user', 'assistant'].includes(msg.role) || typeof msg.content !== 'string') {
      throw new AppError('Invalid message format', 400, 'VALIDATION_ERROR');
    }
    const content = msg.content.trim();
    if (!content) continue; // e.g. an empty assistant reply left by an interrupted stream
    if (content.length > MAX_MESSAGE_CHARS) {
      throw new AppError(`Messages must be at most ${MAX_MESSAGE_CHARS} characters`, 400, 'VALIDATION_ERROR');
    }
    // Merge consecutive messages with the same role so roles always alternate.
    const prev = cleaned[cleaned.length - 1];
    if (prev && prev.role === msg.role) prev.content += `\n\n${content}`;
    else cleaned.push({ role: msg.role, content });
  }

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
    throw new AppError('Last message must be from user', 400, 'VALIDATION_ERROR');
  }

  let bounded = cleaned.slice(-MAX_HISTORY);
  while (bounded.length && bounded[0].role !== 'user') bounded = bounded.slice(1);
  return bounded;
}

export const AiController = {
  /**
   * POST /api/ai/chat/:childId
   * Streams the reply as Server-Sent Events.
   * Body: { messages: ChatMessage[] }
   * Events: connected {mode} → chunk {text}* → done {fullText, source} | error {message, code}
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    const abort = new AbortController();
    try {
      const { childId } = req.params;
      const messages = sanitizeMessages(req.body?.messages);
      const child = await loadChildForChat(childId, req.user!.id); // 404 / 403 as normal JSON errors

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
      res.flushHeaders();

      // Stop generating (and stop paying for tokens) if the client goes away.
      res.on('close', () => {
        if (!res.writableEnded) abort.abort();
      });

      const send = (event: string, data: unknown) => {
        if (!res.writableEnded && !abort.signal.aborted) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      send('connected', { mode: getAiStatus().mode });

      const { fullText, source } = await streamAIResponse(
        child,
        messages,
        (text) => send('chunk', { text }),
        abort.signal,
      );

      send('done', { fullText, source });
      if (!res.writableEnded) res.end();
    } catch (err) {
      if (!res.headersSent) return next(err);
      if (abort.signal.aborted) return;

      const status = err instanceof AppError ? err.statusCode : 500;
      const message = err instanceof AppError
        ? err.message
        : 'The assistant could not answer right now. Please try again in a moment.';
      if (!(err instanceof AppError)) logger.error('AI chat stream error:', err);
      if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({ message, code: status })}\n\n`);
        res.end();
      }
    }
  },

  /**
   * GET /api/ai/summary/:childId
   * Compact summary of the child's health status for the chat sidebar.
   */
  async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await getChildSummary(req.params.childId, req.user!.id);
      ApiResponse.success(res, summary);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/ai/status
   * Which engine answers questions: Claude (valid API key) or the built-in knowledge base.
   */
  async status(_req: Request, res: Response): Promise<void> {
    ApiResponse.success(res, getAiStatus());
  },
};
