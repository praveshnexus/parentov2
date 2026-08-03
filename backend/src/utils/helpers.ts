import { Request } from 'express';
import bcrypt from "bcryptjs";

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const getPagination = (req: Request, defaultLimit = 20): PaginationOptions => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (): string => {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4().replace(/-/g, '');
};

export const sanitizeUser = <T extends { password?: string | null }>(user: T): Omit<T, 'password'> => {
  const { password: _password, ...rest } = user;
  return rest;
};
