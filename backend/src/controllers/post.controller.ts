// controllers/post.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post.service';
import { CommentService } from '../services/comment.service';
import { ApiResponse } from '../utils/response';
import { getPagination } from '../utils/helpers';

export const PostController = {
  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const { posts, total } = await PostService.getFeed(req.user!.id, page, limit);
      ApiResponse.paginated(res, posts, { page, limit, total });
    } catch (err) { next(err); }
  },

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const post = await PostService.createPost(req.user!.id, req.body, files);
      ApiResponse.created(res, post);
    } catch (err) { next(err); }
  },

  async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await PostService.updatePost(req.user!.id, req.params.id, req.body.content);
      ApiResponse.success(res, post);
    } catch (err) { next(err); }
  },

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      await PostService.deletePost(req.user!.id, req.params.id, req.user!.role);
      ApiResponse.noContent(res);
    } catch (err) { next(err); }
  },

  async toggleLike(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PostService.toggleLike(req.user!.id, req.params.id);
      ApiResponse.success(res, result);
    } catch (err) { next(err); }
  },

  async toggleBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PostService.toggleBookmark(req.user!.id, req.params.id);
      ApiResponse.success(res, result);
    } catch (err) { next(err); }
  },

  async getBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const { posts, total } = await PostService.getBookmarks(req.user!.id, page, limit);
      ApiResponse.paginated(res, posts, { page, limit, total });
    } catch (err) { next(err); }
  },

  async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await PostService.getTrending();
      ApiResponse.success(res, posts);
    } catch (err) { next(err); }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const { posts, total } = await PostService.search(req.query.q as string, page, limit);
      ApiResponse.paginated(res, posts, { page, limit, total });
    } catch (err) { next(err); }
  },

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const result = await CommentService.getComments(req.params.id, page, limit, req.user!.id);
      ApiResponse.paginated(res, result.comments, { page, limit, total: result.total });
    } catch (err) { next(err); }
  },

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await CommentService.createComment(
        req.user!.id,
        req.params.id,
        req.body.content,
        req.body.parentId
      );
      ApiResponse.created(res, comment);
    } catch (err) { next(err); }
  },

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      await CommentService.deleteComment(req.user!.id, req.params.commentId, req.user!.role);
      ApiResponse.noContent(res);
    } catch (err) { next(err); }
  },
};
