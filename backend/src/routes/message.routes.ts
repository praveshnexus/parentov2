import { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { MessageService } from "../services/message.service";
import { ApiResponse } from "../utils/response";
import { authenticate } from "../middlewares/auth.middleware";
import { getPagination } from "../utils/helpers";

const MessageController = {
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await MessageService.getConversations(req.user!.id);
      ApiResponse.success(res, conversations);
    } catch (err) {
      next(err);
    }
  },

  async getOrCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ success: false, message: "userId required" });
        return;
      }
      const conv = await MessageService.getOrCreateConversation(
        req.user!.id,
        userId,
      );
      ApiResponse.success(res, conv);
    } catch (err) {
      next(err);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req, 50);
      const result = await MessageService.getMessages(
        req.params.conversationId,
        req.user!.id,
        page,
        limit,
      );
      ApiResponse.paginated(res, result.messages, {
        page,
        limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async send(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = req.body;
      if (!content?.trim()) {
        res.status(400).json({ success: false, message: "content required" });
        return;
      }
      const message = await MessageService.sendMessage(
        req.params.conversationId,
        req.user!.id,
        content.trim(),
      );
      ApiResponse.created(res, message);
    } catch (err) {
      next(err);
    }
  },

  async getByAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const conversation = await MessageService.getConversationByAppointment(
        req.params.appointmentId,
        req.user!.id,
      );

      ApiResponse.success(res, conversation);
    } catch (err) {
      next(err);
    }
  },
};

const router = Router();
router.use(authenticate);
router.get("/conversations", MessageController.getConversations);
router.get("/appointment/:appointmentId", MessageController.getByAppointment);
router.post("/conversations", MessageController.getOrCreate);
router.get(
  "/conversations/:conversationId/messages",
  MessageController.getMessages,
);
router.post("/conversations/:conversationId/messages", MessageController.send);

export default router;
