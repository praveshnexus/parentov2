import { prisma } from "../config/prisma";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors";
import { Cache } from "../config/redis";

export const DoctorService = {
  async listDoctors(params: {
    page: number;
    limit: number;
    search?: string;
    specialty?: string;
    minRating?: number;
  }) {
    const { page, limit, search, specialty, minRating } = params;
    const skip = (page - 1) * limit;

    const where: any = { status: "VERIFIED" };
    if (specialty)
      where.specialty = { contains: specialty, mode: "insensitive" };
    if (minRating) where.rating = { gte: minRating };
    if (search) {
      where.OR = [
        { specialty: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: "desc" },
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true, email: true },
          },
          _count: { select: { reviews: true, appointments: true } },
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, total };
  },

  async getDoctorById(id: string) {
    const cacheKey = `doctor:${id}`;
    const cached = await Cache.get(cacheKey);
    if (cached) return cached;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, email: true },
        },
        availability: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        _count: { select: { reviews: true, appointments: true } },
      },
    });

    if (!doctor) throw new NotFoundError("Doctor");
    await Cache.set(cacheKey, doctor, 300);
    return doctor;
  },

  async registerDoctor(
    userId: string,
    data: {
      specialty: string;
      qualifications: string;
      experience: number;
      bio?: string;
      location?: string;
      consultationFee: number;
      licenseNumber?: string;
    },
  ) {
    const existing = await prisma.doctor.findUnique({ where: { userId } });
    if (existing) throw new ConflictError("Doctor profile already exists");

    await prisma.user.update({
      where: { id: userId },
      data: { role: "DOCTOR" },
    });
    return prisma.doctor.create({
      data: {
        userId,
        ...data,
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
  },

  async updateDoctor(
    userId: string,
    data: Partial<{
      specialty: string;
      qualifications: string;
      experience: number;
      bio: string;
      location: string;
      consultationFee: number;
    }>,
  ) {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundError("Doctor profile");

    const updated = await prisma.doctor.update({ where: { userId }, data });
    await Cache.del(`doctor:${doctor.id}`);
    return updated;
  },

  async verifyDoctor(
    doctorId: string,
    adminId: string,
    approved: boolean,
    notes?: string,
  ) {
    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        status: approved ? "VERIFIED" : "REJECTED",
        verifiedAt: approved ? new Date() : null,
        verifiedBy: adminId,
      },
      include: { user: true },
    });

    await Cache.del(`doctor:${doctorId}`);

    // Notify doctor
    const { NotificationService } = await import("./notification.service");
    await NotificationService.create({
      recipientId: doctor.userId,
      type: "DOCTOR_VERIFIED",
      title: approved ? "Profile approved!" : "Profile update needed",
      body: approved
        ? "Your doctor profile has been verified. You can now accept appointments."
        : `Your profile was not approved. ${notes ?? ""}`,
    });

    return doctor;
  },

  async setAvailability(
    userId: string,
    availability: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>,
  ) {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundError("Doctor profile");

    await prisma.doctorAvailability.deleteMany({
      where: { doctorId: doctor.id },
    });
    await prisma.doctorAvailability.createMany({
      data: availability.map((a) => ({ ...a, doctorId: doctor.id })),
    });

    await Cache.del(`doctor:${doctor.id}`);
    return prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.id },
    });
  },

  async addReview(
    doctorId: string,
    authorId: string,
    rating: number,
    comment?: string,
  ) {
    const existing = await prisma.review.findUnique({
      where: { doctorId_authorId: { doctorId, authorId } },
    });
    if (existing)
      throw new ConflictError("You have already reviewed this doctor");

    const review = await prisma.review.create({
      data: { doctorId, authorId, rating, comment },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Recalculate average rating
    const { _avg, _count } = await prisma.review.aggregate({
      where: { doctorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        rating: _avg.rating ?? 0,
        reviewCount: _count.rating,
      },
    });

    await Cache.del(`doctor:${doctorId}`);
    return review;
  },
};
