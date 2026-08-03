import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export const ApiResponse = {
  success<T>(
    res: Response,
    data: T,
    options: { message?: string; statusCode?: number; meta?: Record<string, unknown> } = {}
  ): void {
    const { message, statusCode = 200, meta } = options;
    const body: SuccessResponse<T> = { success: true, data };
    if (message) body.message = message;
    if (meta) body.meta = meta;
    res.status(statusCode).json(body);
  },

  created<T>(res: Response, data: T, message?: string): void {
    ApiResponse.success(res, data, { statusCode: 201, message });
  },

  noContent(res: Response): void {
    res.status(204).send();
  },

  error(
    res: Response,
    message: string,
    options: { statusCode?: number; code?: string; errors?: Record<string, string[]> } = {}
  ): void {
    const { statusCode = 500, code, errors } = options;
    const body: ErrorResponse = { success: false, message };
    if (code) body.code = code;
    if (errors) body.errors = errors;
    res.status(statusCode).json(body);
  },

  paginated<T>(
    res: Response,
    data: T[],
    options: {
      page: number;
      limit: number;
      total: number;
      message?: string;
    }
  ): void {
    const { page, limit, total, message } = options;
    const totalPages = Math.ceil(total / limit);
    ApiResponse.success(res, data, {
      message,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  },
};
