import { Request, Response, NextFunction } from "express";
import { DoctorService } from "../services/doctor.service";
import { ApiResponse } from "../utils/response";
import { getPagination } from "../utils/helpers";

export const DoctorController = {
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { prisma } = await import("../config/prisma");
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user!.id },
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true, email: true },
          },
          availability: true,
          _count: { select: { reviews: true, appointments: true } },
        },
      });
      ApiResponse.success(res, doctor);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const result = await DoctorService.listDoctors({
        page,
        limit,
        search: req.query.search as string,
        specialty: req.query.specialty as string,
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
      });
      ApiResponse.paginated(res, result.doctors, {
        page,
        limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorService.getDoctorById(req.params.id);
      ApiResponse.success(res, doctor);
    } catch (err) {
      next(err);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorService.registerDoctor(req.user!.id, req.body);
      ApiResponse.created(res, doctor, "Doctor profile submitted for review");
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorService.updateDoctor(req.user!.id, req.body);
      ApiResponse.success(res, doctor);
    } catch (err) {
      next(err);
    }
  },

  async setAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const availability = await DoctorService.setAvailability(
        req.user!.id,
        req.body.availability,
      );
      ApiResponse.success(res, availability);
    } catch (err) {
      next(err);
    }
  },

  async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await DoctorService.addReview(
        req.params.id,
        req.user!.id,
        req.body.rating,
        req.body.comment,
      );
      ApiResponse.created(res, review);
    } catch (err) {
      next(err);
    }
  },

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorService.verifyDoctor(
        req.params.id,
        req.user!.id,
        req.body.approved,
        req.body.notes,
      );
      ApiResponse.success(res, doctor, {
        message: req.body.approved ? "Doctor verified" : "Doctor rejected",
      });
    } catch (err) {
      next(err);
    }
  },
};
