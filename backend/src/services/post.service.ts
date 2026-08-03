import { prisma } from '../config/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { uploadImage, deleteImage } from '../utils/cloudinary';
import { Cache } from '../config/redis';
import { NotificationService } from './notification.service';

export interface CreatePostDto {
  content: string;
  hashtags?: string[];
}

export const PostService = {
  async getFeed(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { status: 'ACTIVE' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, fullName: true, avatarUrl: true, role: true },
          },
          _count: { select: { likes: true, comments: true, bookmarks: true } },
          likes: { where: { userId }, select: { id: true } },
          bookmarks: { where: { userId }, select: { id: true } },
        },
      }),
      prisma.post.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      posts: posts.map((p) => ({
        ...p,
        isLiked: p.likes.length > 0,
        isBookmarked: p.bookmarks.length > 0,
        likes: undefined,
        bookmarks: undefined,
      })),
      total,
    };
  },

  async createPost(
    userId: string,
    dto: CreatePostDto,
    files?: Express.Multer.File[]
  ) {
    const mediaUrls: string[] = [];
    const mediaPublicIds: string[] = [];

    if (files?.length) {
      for (const file of files) {
        const result = await uploadImage(file.buffer, 'posts');
        mediaUrls.push(result.url);
        mediaPublicIds.push(result.publicId);
      }
    }

    const hashtags = dto.hashtags ?? extractHashtags(dto.content);

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content: dto.content,
        hashtags,
        mediaUrls,
        mediaPublicIds,
      },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    await Cache.delPattern('feed:*');

    // Broadcast new post to all connected users in real-time
    try {
      const { io } = await import('../config/socket');
      if (io) io.emit('post:new', post);
    } catch { /* ignore if socket not ready */ }

    return post;
  },

  async updatePost(userId: string, postId: string, content: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post');
    if (post.authorId !== userId) throw new ForbiddenError();

    const hashtags = extractHashtags(content);
    return prisma.post.update({
      where: { id: postId },
      data: { content, hashtags, updatedAt: new Date() },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  },

  async deletePost(userId: string, postId: string, userRole: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post');
    if (post.authorId !== userId && userRole !== 'ADMIN') throw new ForbiddenError();

    // Delete media from Cloudinary
    for (const publicId of post.mediaPublicIds) {
      await deleteImage(publicId).catch(() => {});
    }

    await prisma.post.update({ where: { id: postId }, data: { status: 'DELETED' } });
    await Cache.delPattern('feed:*');
  },

  async toggleLike(userId: string, postId: string) {
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    const [, post] = await prisma.$transaction([
      prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    // 🔥 Emit updated like count
    const { io } = await import("../config/socket");
    io.to(`post:${postId}`).emit("post:liked", {
      postId,
      likesCount: post.likesCount,
    });

    return { liked: false };
  } else {
    const [, post] = await prisma.$transaction([
      prisma.like.create({
        data: { userId, postId },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    // Send notification to post author
    if (post.authorId !== userId) {
      await NotificationService.create({
        recipientId: post.authorId,
        actorId: userId,
        type: "LIKE",
        title: "New like",
        body: "Someone liked your post",
        data: { postId },
      });
    }

    // 🔥 Emit updated like count
    const { io } = await import("../config/socket");
    io.to(`post:${postId}`).emit("post:liked", {
      postId,
      likesCount: post.likesCount,
    });

    return { liked: true };
  }
},

  async toggleBookmark(userId: string, postId: string) {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } });
      return { bookmarked: false };
    } else {
      await prisma.bookmark.create({ data: { userId, postId } });
      return { bookmarked: true };
    }
  },

  async getBookmarks(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              author: { select: { id: true, fullName: true, avatarUrl: true } },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);
    return { posts: bookmarks.map((b) => b.post), total };
  },

  async getTrending(limit = 10) {
    const cacheKey = 'trending_posts';
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const posts = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { likesCount: 'desc' },
      take: limit,
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    await Cache.set(cacheKey, posts, 300); // 5 min cache
    return posts;
  },

  async search(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { hashtags: { has: query.toLowerCase() } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { hashtags: { has: query.toLowerCase() } },
          ],
        },
      }),
    ]);
    return { posts, total };
  },
};

function extractHashtags(content: string): string[] {
  const matches = content.match(/#[a-zA-Z0-9_]+/g) ?? [];
  return [...new Set(matches.map((h) => h.toLowerCase()))];
}
