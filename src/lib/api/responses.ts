import type { NextApiResponse } from "next";

export type SuccessStatus = 200 | 201;

export type ErrorStatus = 400 | 401 | 403 | 404 | 405 | 409 | 429 | 500;

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  status: ErrorStatus;
  message: string;
  data: null;
  errors?: ValidationErrorDetail[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function sendSuccess<T>(
  response: NextApiResponse<ApiResponse<T>>,
  status: SuccessStatus,
  message: string,
  data: T,
): void {
  response.status(status).json({
    success: true,
    message,
    data,
  });
}

export function sendError<T = never>(
  response: NextApiResponse<ApiResponse<T>>,
  status: ErrorStatus,
  message: string,
  errors?: ValidationErrorDetail[],
): void {
  response.status(status).json({
    success: false,
    status,
    message,
    data: null,
    ...(errors === undefined ? {} : { errors }),
  });
}
