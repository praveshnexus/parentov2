import { Request, Response, NextFunction } from 'express';
import { streamAIResponse, getChildSummary, ChatMessage } from '../services/ai.service';
import { ApiResponse } from '../utils/response';
import { AppError } from '../utils/errors';

export const AiController = {
  /**
   * POST /api/ai/chat/:childId
   * Streams AI response as Server-Sent Events (SSE).
   * Body: { messages: ChatMessage[] }
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { childId } = req.params;
      const { messages } = req.body as { messages: ChatMessage[] };

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new AppError('messages array is required', 400);
      }

      // Validate message structure
      for (const msg of messages) {
        if (!['user', 'assistant'].includes(msg.role) || typeof msg.content !== 'string') {
          throw new AppError('Invalid message format', 400);
        }
      }

      // Last message must be from user
      if (messages[messages.length - 1].role !== 'user') {
        throw new AppError('Last message must be from user', 400);
      }

      // Keep conversation history bounded (last 20 messages to control tokens)
      const boundedMessages = messages.slice(-20);

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
      res.flushHeaders();

      // Send a heartbeat immediately so the connection is confirmed
      res.write('event: connected\ndata: {}\n\n');

      let fullText = '';

      await streamAIResponse(
        childId,
        req.user!.id,
        boundedMessages,
        (chunk: string) => {
          fullText += chunk;
          // SSE data event with escaped newlines
          const payload = JSON.stringify({ text: chunk });
          res.write(`event: chunk\ndata: ${payload}\n\n`);
        },
        () => {
          // Send done event with full text for client to store in history
          const donePayload = JSON.stringify({ fullText });
          res.write(`event: done\ndata: ${donePayload}\n\n`);
          res.end();
        }
      );
    } catch (err) {
      // If headers already sent (streaming started), send error event
      if (res.headersSent) {
        const errMsg = err instanceof Error ? err.message : 'Stream error';
        res.write(`event: error\ndata: ${JSON.stringify({ message: errMsg })}\n\n`);
        res.end();
      } else {
        next(err);
      }
    }
  },

  /**
   * GET /api/ai/summary/:childId
   * Returns a compact summary of the child's health status for the chat sidebar.
   */
  async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await getChildSummary(req.params.childId, req.user!.id);
      ApiResponse.success(res, summary);
    } catch (err) {
      next(err);
    }
  },
};
