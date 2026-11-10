import { OAuth2Client } from "google-auth-library";
import { Role } from "@prisma/client";
import { AuthRepository } from "../repositories/auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  cookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "../utils/jwt";
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
} from "../utils/helpers";
import { sendEmail, emailTemplates } from "../utils/email";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  AppError,
} from "../utils/errors";
import { config } from "../config/env";
import { Response } from "express";
import type {
  SignupDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "../validators/auth.validator";

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

export const AuthService = {
  async signup(dto: SignupDto, res: Response) {
    

    const existing = await AuthRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError("Email already registered");

    const hashedPassword = await hashPassword(dto.password);

    const user = await AuthRepository.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      phone: dto.phone,
      role: dto.role as Role,
    });

 

    // Send verification email
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await AuthRepository.createEmailVerification(user.id, token, expiresAt);

    await sendEmail({
      to: user.email,
      subject: "Verify your Parento email",
      html: emailTemplates.verifyEmail(user.fullName, token),
    });

    const tokens = await AuthService._issueTokens(
      user.id,
      user.email,
      user.role,
      res,
    );

    await AuthRepository.updateLastLogin(user.id);

    return {
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
    };
  },
  async login(dto: LoginDto, res: Response) {
    const user = await AuthRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedError("Invalid credentials");
    if (!user.password)
      throw new UnauthorizedError("Please sign in with Google");
    if (!user.isActive) throw new UnauthorizedError("Account is deactivated");

    const isMatch = await comparePassword(dto.password, user.password);

   
    if (!isMatch) throw new UnauthorizedError("Invalid credentials");

    const tokens = await AuthService._issueTokens(
      user.id,
      user.email,
      user.role,
      res,
    );
    await AuthRepository.updateLastLogin(user.id);

    return { user: sanitizeUser(user), accessToken: tokens.accessToken };
  },

  async googleAuth(idToken: string, res: Response) {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError("Invalid Google token", 400);

    let user = await AuthRepository.findByGoogleId(payload.sub);

    if (!user) {
      user = await AuthRepository.findByEmail(payload.email);
      if (user) {
        // Link Google to existing account
        // (update handled via direct prisma call)
        const { prisma } = await import("../config/prisma");
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub, isEmailVerified: true },
        });
      } else {
        user = await AuthRepository.create({
          email: payload.email,
          googleId: payload.sub,
          fullName: payload.name ?? payload.email.split("@")[0],
          avatarUrl: payload.picture,
          role: Role.PARENT,
          isEmailVerified: true,
        });
      }
    }

    if (!user.isActive) throw new UnauthorizedError("Account is deactivated");

    const tokens = await AuthService._issueTokens(
      user.id,
      user.email,
      user.role,
      res,
    );
    await AuthRepository.updateLastLogin(user.id);

    return { user: sanitizeUser(user), accessToken: tokens.accessToken };
  },

  async refreshToken(token: string, res: Response) {
    if (!token) throw new UnauthorizedError("Refresh token required");

    const record = await AuthRepository.findRefreshToken(token);
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
    if (!record.user.isActive)
      throw new UnauthorizedError("Account is deactivated");

    // Rotate refresh token
    await AuthRepository.deleteRefreshToken(token);
    const tokens = await AuthService._issueTokens(
      record.user.id,
      record.user.email,
      record.user.role,
      res,
    );

    return { accessToken: tokens.accessToken };
  },

  async logout(userId: string, refreshToken: string, res: Response) {
    await AuthRepository.deleteRefreshToken(refreshToken);
    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
  },

  async verifyEmail(token: string) {
    const record = await AuthRepository.findEmailVerification(token);
    if (!record || record.expiresAt < new Date()) {
      throw new AppError("Verification link is invalid or expired", 400);
    }
    await AuthRepository.setEmailVerified(record.userId);
    await AuthRepository.deleteEmailVerification(record.id);
  },

  async forgotPassword(dto: ForgotPasswordDto) {
  const user = await AuthRepository.findByEmail(dto.email);

  // Don't reveal if email exists
  if (!user) {
    return {
      message: "If the email exists, a reset link has been generated.",
    };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await AuthRepository.createPasswordReset(
    user.id,
    token,
    expiresAt,
  );

  const resetLink = `${config.CLIENT_URL}/reset-password?token=${token}`;

  if (config.NODE_ENV === "development") {
    console.log("\n==============================");
    console.log("PASSWORD RESET LINK");
    console.log(resetLink);
    console.log("==============================\n");

    return {
      message: "Reset link generated.",
      resetLink,
    };
  }

  await sendEmail({
    to: user.email,
    subject: "Reset your Parento password",
    html: emailTemplates.resetPassword(user.fullName, token),
  });

  return {
    message: "Reset link sent.",
  };
},

  async resetPassword(dto: ResetPasswordDto) {
    const record = await AuthRepository.findPasswordReset(dto.token);
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new AppError("Reset link is invalid or expired", 400);
    }
    const hashedPassword = await hashPassword(dto.password);
    await AuthRepository.updatePassword(record.userId, hashedPassword);
    await AuthRepository.markPasswordResetUsed(record.id);
    await AuthRepository.deleteAllUserRefreshTokens(record.userId);
  },

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await AuthRepository.findById(userId);
    if (!user?.password)
      throw new AppError("Cannot change password for Google accounts", 400);

    const isMatch = await comparePassword(dto.currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedError("Current password is incorrect");

    const hashedPassword = await hashPassword(dto.newPassword);
    await AuthRepository.updatePassword(userId, hashedPassword);
    await AuthRepository.deleteAllUserRefreshTokens(userId);
  },

  async _issueTokens(
    userId: string,
    email: string,
    role: string,
    res: Response,
  ) {
    const payload = { userId, email, role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
    await AuthRepository.createRefreshToken(userId, refreshToken, expiresAt);

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);
    return { accessToken, refreshToken };
  },
};
