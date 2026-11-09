import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response {
  const payload: ApiResponse<T> = {
    success: true,
  };
  if (message !== undefined) payload.message = message;
  if (data !== undefined) payload.data = data;

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  error?: any
): Response {
  const payload: ApiResponse = {
    success: false,
    message,
  };
  if (error !== undefined) payload.error = error;

  return res.status(statusCode).json(payload);
}
