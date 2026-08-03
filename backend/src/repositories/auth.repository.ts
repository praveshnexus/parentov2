import { prisma } from '../config/prisma';
import { User, Role } from '@prisma/client';

export const AuthRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } });
  },

  async create(data: {
    email: string;
    password?: string;
    googleId?: string;
    fullName: string;
    phone?: string;
    role: Role;
    isEmailVerified?: boolean;
    avatarUrl?: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  },

  async updatePassword(userId: string, password: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { password } });
  },

  async setEmailVerified(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
  },

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  },

  // Refresh tokens
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  },

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { token } }).catch(() => {});
  },

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  // Email verification
  async createEmailVerification(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.emailVerification.deleteMany({ where: { userId } });
    await prisma.emailVerification.create({ data: { userId, token, expiresAt } });
  },

  async findEmailVerification(token: string) {
    return prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async deleteEmailVerification(id: string): Promise<void> {
    await prisma.emailVerification.delete({ where: { id } }).catch(() => {});
  },

  // Password reset
  async createPasswordReset(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.passwordReset.deleteMany({ where: { userId } });
    await prisma.passwordReset.create({ data: { userId, token, expiresAt } });
  },

  async findPasswordReset(token: string) {
    return prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async markPasswordResetUsed(id: string): Promise<void> {
    await prisma.passwordReset.update({ where: { id }, data: { used: true } });
  },
};
