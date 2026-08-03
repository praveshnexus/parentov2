import { prisma } from '../config/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { NotificationService } from './notification.service';

export const CommentService = {
  async getComments(postId: string, page: number, limit: number, userId: string) {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId, parentId: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          replies: {
            take: 3,
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, fullName: true, avatarUrl: true } },
            },
          },
          _count: { select: { replies: true, likes: true } },
          likes: { where: { userId }, select: { id: true } },
        },
      }),
      prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return {
      comments: comments.map((c) => ({
        ...c,
        isLiked: c.likes.length > 0,
        likes: undefined,
      })),
      total,
    };
  },

  async getReplies(commentId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.comment.count({ where: { parentId: commentId } }),
    ]);
    return { replies, total };
  },

  async createComment(userId: string, postId: string, content: string, parentId?: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post');

    const comment = await prisma.comment.create({
      data: { authorId: userId, postId, content, parentId },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    // Notify post author
    if (post.authorId !== userId) {
      await NotificationService.create({
        recipientId: post.authorId,
        actorId: userId,
        type: 'COMMENT',
        title: 'New comment',
        body: content.substring(0, 100),
        data: { postId, commentId: comment.id },
      });
    }

    // Notify parent comment author for replies
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (parent && parent.authorId !== userId) {
        await NotificationService.create({
          recipientId: parent.authorId,
          actorId: userId,
          type: 'REPLY',
          title: 'New reply',
          body: content.substring(0, 100),
          data: { postId, commentId: comment.id },
        });
      }
    }

    return comment;
  },

  async deleteComment(userId: string, commentId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundError('Comment');
    if (comment.authorId !== userId && userRole !== 'ADMIN') throw new ForbiddenError();

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.post.update({
        where: { id: comment.postId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);
  },
};
