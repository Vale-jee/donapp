import type { NextApiResponse } from "next";
import { ZodError } from "zod";

import {
  sendError,
  type ApiResponse,
  type ErrorStatus,
  type ValidationErrorDetail,
} from "./responses";

const INTERNAL_ERROR_MESSAGE = "Error interno del servidor";
const VALIDATION_ERROR_MESSAGE = "Datos inválidos";

export class ApiError extends Error {
  readonly status: ErrorStatus;

  constructor(status: ErrorStatus, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function formatZodError(error: ZodError): ValidationErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "_root",
    message: issue.message,
  }));
}

export function handleApiError<T = never>(
  error: unknown,
  response: NextApiResponse<ApiResponse<T>>,
): void {
  if (error instanceof ApiError) {
    sendError(response, error.status, error.message);
    return;
  }

  if (error instanceof ZodError) {
    sendError(
      response,
      400,
      VALIDATION_ERROR_MESSAGE,
      formatZodError(error),
    );
    return;
  }

  console.error("Unhandled API error", error);
  sendError(response, 500, INTERNAL_ERROR_MESSAGE);
}
