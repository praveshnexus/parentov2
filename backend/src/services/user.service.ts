import { prisma } from '../config/prisma';
import { NotFoundError } from '../utils/errors';
import { uploadImage, deleteImage, uploadAvatarTransformation } from '../utils/cloudinary';
import { sanitizeUser } from '../utils/helpers';

export const UserService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        doctor: {
          select: {
            id: true, specialty: true, status: true, rating: true, reviewCount: true,
          },
        },
        _count: {
          select: { posts: true, children: true },
        },
      },
    });
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async updateProfile(userId: string, data: {
    fullName?: string;
    phone?: string;
    bio?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, fullName: true, phone: true, bio: true, avatarUrl: true, role: true,
      },
    });
    return user;
  },

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    // Delete old avatar
    if (user.avatarPublicId) {
      await deleteImage(user.avatarPublicId).catch(() => {});
    }

    const result = await uploadImage(file.buffer, 'avatars', {
      transformation: uploadAvatarTransformation,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.url, avatarPublicId: result.publicId },
    });

    return { avatarUrl: result.url };
  },

  async deleteAccount(userId: string) {
    // Soft-delete: deactivate account
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, email: `deleted_${Date.now()}_${userId}@deleted.com` },
    });
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async searchUsers(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        select: { id: true, fullName: true, avatarUrl: true, role: true, bio: true },
      }),
      prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    return { users, total };
  },
};
