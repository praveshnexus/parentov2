import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../utils/response";
import { REFRESH_TOKEN_COOKIE } from "../utils/jwt";
import {
  signupSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/auth.validator";

export const AuthController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = signupSchema.parse(req.body);

      const result = await AuthService.signup(dto, res);

      ApiResponse.created(res, result, "Account created successfully.");
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await AuthService.login(dto, res);
      ApiResponse.success(res, result, { message: "Login successful" });
    } catch (err) {
      next(err);
    }
  },

  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = googleAuthSchema.parse(req.body);
      const result = await AuthService.googleAuth(dto.idToken, res);
      ApiResponse.success(res, result, {
        message: "Google authentication successful",
      });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies[REFRESH_TOKEN_COOKIE];
      const result = await AuthService.refreshToken(token, res);
      ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies[REFRESH_TOKEN_COOKIE];
      await AuthService.logout(req.user!.id, token, res);
      ApiResponse.noContent(res);
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query as { token: string };
      await AuthService.verifyEmail(token);
      ApiResponse.success(res, null, {
        message: "Email verified successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = forgotPasswordSchema.parse(req.body);

      const result = await AuthService.forgotPassword(dto);

      ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(dto);
      ApiResponse.success(res, null, {
        message: "Password reset successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = changePasswordSchema.parse(req.body);
      await AuthService.changePassword(req.user!.id, dto);
      ApiResponse.success(res, null, {
        message: "Password changed successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const { prisma } = await import("../config/prisma");
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
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
            select: { id: true, specialty: true, status: true, rating: true },
          },
        },
      });
      ApiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  },
};
