import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { Cache } from '../config/redis';

export const AdminService = {
  async getDashboardStats() {
    const cacheKey = 'admin:dashboard';
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      totalDoctors,
      pendingDoctors,
      totalPosts,
      totalAppointments,
      appointmentsThisWeek,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.doctor.count({ where: { status: 'VERIFIED' } }),
      prisma.doctor.count({ where: { status: 'PENDING' } }),
      prisma.post.count({ where: { status: 'ACTIVE' } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    // Monthly signups for chart
    const monthlySignups = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
             COUNT(*)::int as count
      FROM users
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    const stats = {
      totalUsers,
      newUsers30d,
      totalDoctors,
      pendingDoctors,
      totalPosts,
      totalAppointments,
      appointmentsThisWeek,
      pendingReports,
      monthlySignups,
    };

    await Cache.set(cacheKey, stats, 300);
    return stats;
  },

  async getUsers(page: number, limit: number, search?: string, role?: Role) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, fullName: true, role: true, isActive: true,
          isEmailVerified: true, createdAt: true, lastLoginAt: true,
          doctor: { select: { status: true, specialty: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  },

  async toggleUserActive(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: updated.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        target: 'user',
        targetId: userId,
      },
    });

    return updated;
  },

  async getPendingDoctors(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        },
      }),
      prisma.doctor.count({ where: { status: 'PENDING' } }),
    ]);
    return { doctors, total };
  },

  async getReports(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { id: true, fullName: true, email: true } },
          reportedUser: { select: { id: true, fullName: true, email: true } },
          post: { select: { id: true, content: true } },
        },
      }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);
    return { reports, total };
  },

  async resolveReport(reportId: string, adminId: string, action: 'DISMISS' | 'ACTION_TAKEN') {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: action === 'DISMISS' ? 'DISMISSED' : 'ACTION_TAKEN',
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });

    await prisma.adminLog.create({
      data: { adminId, action: `REPORT_${action}`, target: 'report', targetId: reportId },
    });

    return report;
  },

  async getAuditLogs(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);
    return { logs, total };
  },
};
