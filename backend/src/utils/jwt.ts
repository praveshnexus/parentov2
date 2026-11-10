
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  const accessOptions: SignOptions = {
    expiresIn: config.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, config.JWT_ACCESS_SECRET, accessOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const refreshOptions: SignOptions = {
    expiresIn: config.JWT_REFRESH_EXPIRES as SignOptions['expiresIn'],
    jwtid: randomUUID(),
  };

  return jwt.sign(payload, config.JWT_REFRESH_SECRET, refreshOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
};

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
