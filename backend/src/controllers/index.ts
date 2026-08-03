import { Request, Response, NextFunction } from "express";
import { AppointmentService } from "../services/appointment.service";
import { ChildService } from "../services/child.service";
import { UserService } from "../services/user.service";
import { AdminService } from "../services/admin.service";
import { NotificationService } from "../services/notification.service";
import { ApiResponse } from "../utils/response";
import { getPagination } from "../utils/helpers";
import { AppointmentStatus, AppointmentMode } from "@prisma/client";

// ============================================================
// APPOINTMENT CONTROLLER
// ============================================================

export const AppointmentController = {
  async book(req: Request, res: Response, next: NextFunction) {
    try {
      const { doctorId, scheduledAt, mode, reason, durationMinutes } = req.body;
      const appointment = await AppointmentService.bookAppointment(
        req.user!.id,
        {
          doctorId,
          scheduledAt: new Date(scheduledAt),
          mode: mode as AppointmentMode,
          reason,
          durationMinutes,
        },
      );
      ApiResponse.created(res, appointment, "Appointment booked successfully");
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const appointments = await AppointmentService.getAppointments(
        req.user!.id,
        req.user!.role,
        req.query.status as AppointmentStatus,
      );

      console.log("CONTROLLER APPOINTMENTS:", appointments);

      ApiResponse.success(res, appointments);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentService.updateStatus(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body.status,
        req.body.notes,
      );
      ApiResponse.success(res, appointment);
    } catch (err) {
      next(err);
    }
  },
};

// ============================================================
// CHILD CONTROLLER
// ============================================================

export const ChildController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const children = await ChildService.getChildren(req.user!.id);
      ApiResponse.success(res, children);
    } catch (err) {
      next(err);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const child = await ChildService.getChild(req.user!.id, req.params.id);
      ApiResponse.success(res, child);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const child = await ChildService.createChild(req.user!.id, {
        name: req.body.name,
        dateOfBirth: new Date(req.body.dateOfBirth),
        gender: req.body.gender,
        bloodType: req.body.bloodType,
        allergies: req.body.allergies,
      });
      ApiResponse.created(res, child);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const child = await ChildService.updateChild(
        req.user!.id,
        req.params.id,
        req.body,
      );
      ApiResponse.success(res, child);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ChildService.deleteChild(req.user!.id, req.params.id);
      ApiResponse.noContent(res);
    } catch (err) {
      next(err);
    }
  },

  async addGrowth(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await ChildService.addGrowthRecord(
        req.user!.id,
        req.params.id,
        req.body,
      );
      ApiResponse.created(res, record);
    } catch (err) {
      next(err);
    }
  },

  async getGrowth(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await ChildService.getGrowthRecords(
        req.user!.id,
        req.params.id,
      );
      ApiResponse.success(res, records);
    } catch (err) {
      next(err);
    }
  },

  async getMilestones(req: Request, res: Response, next: NextFunction) {
    try {
      const milestones = await ChildService.getMilestones(
        req.user!.id,
        req.params.id,
      );
      ApiResponse.success(res, milestones);
    } catch (err) {
      next(err);
    }
  },

  async toggleMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const milestone = await ChildService.toggleMilestone(
        req.user!.id,
        req.params.id,
        req.params.milestoneId,
      );
      ApiResponse.success(res, milestone);
    } catch (err) {
      next(err);
    }
  },

  async getVaccinations(req: Request, res: Response, next: NextFunction) {
    try {
      const vaccinations = await ChildService.getVaccinations(
        req.user!.id,
        req.params.id,
      );
      ApiResponse.success(res, vaccinations);
    } catch (err) {
      next(err);
    }
  },

  async addVaccination(req: Request, res: Response, next: NextFunction) {
    try {
      const v = await ChildService.addVaccination(req.user!.id, req.params.id, {
        name: req.body.name,
        scheduledDate: new Date(req.body.scheduledDate),
        administeredAt: req.body.administeredAt
          ? new Date(req.body.administeredAt)
          : undefined,
        batchNumber: req.body.batchNumber,
        notes: req.body.notes,
      });
      ApiResponse.created(res, v);
    } catch (err) {
      next(err);
    }
  },
};

// ============================================================
// USER CONTROLLER
// ============================================================

export const UserController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getProfile(req.user!.id);
      ApiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.updateProfile(req.user!.id, req.body);
      ApiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }
      const result = await UserService.uploadAvatar(req.user!.id, req.file);
      ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.deleteAccount(req.user!.id);
      ApiResponse.noContent(res);
    } catch (err) {
      next(err);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const result = await UserService.searchUsers(
        req.query.q as string,
        page,
        limit,
      );
      ApiResponse.paginated(res, result.users, {
        page,
        limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },
};

// ============================================================
// ADMIN CONTROLLER
// ============================================================

export const AdminController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      ApiResponse.success(res, stats);
    } catch (err) {
      next(err);
    }
  },

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const result = await AdminService.getUsers(
        page,
        limit,
        req.query.search as string,
        req.query.role as any,
      );
      ApiResponse.paginated(res, result.users, {
        page,
        limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async toggleUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.toggleUserActive(
        req.params.id,
        req.user!.id,
      );
      ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getPendingDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const result = await AdminService.getPendingDoctors(page, limit);
      ApiResponse.paginated(res, result.doctors, {
        page,
        limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const result = await AdminService.getReports(page, limit);
      ApiResponse.paginated(res, result.reports, {
        page,
        limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await AdminService.resolveReport(
        req.params.id,
        req.user!.id,
        req.body.action,
      );
      ApiResponse.success(res, report);
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const result = await AdminService.getAuditLogs(page, limit);
      ApiResponse.paginated(res, result.logs, {
        page,
        limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },
};

// ============================================================
// NOTIFICATION CONTROLLER
// ============================================================

export const NotificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPagination(req);
      const result = await NotificationService.getAll(
        req.user!.id,
        page,
        limit,
      );
      ApiResponse.paginated(res, result.notifications, {
        page,
        limit,
        total: result.total,
        message: String(result.unreadCount),
      });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markRead(req.user!.id, req.params.id);
      ApiResponse.noContent(res);
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllRead(req.user!.id);
      ApiResponse.noContent(res);
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.id);
      ApiResponse.success(res, { count });
    } catch (err) {
      next(err);
    }
  },
};
export { PostController } from "./post.controller";
export { DoctorController } from "./doctor.controller";
