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

export type ApiErrorCategory =
  | "validation"
  | "authentication"
  | "authorization"
  | "business_rule"
  | "rate_limit"
  | "internal";

export interface HandledApiError {
  status: ErrorStatus;
  category: ApiErrorCategory;
  message: string;
}

export class ApiError extends Error {
  readonly status: ErrorStatus;
  readonly category: ApiErrorCategory;

  constructor(
    status: ErrorStatus,
    message: string,
    category: ApiErrorCategory = "business_rule",
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.category = category;
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
): HandledApiError {
  if (error instanceof ApiError) {
    sendError(response, error.status, error.message);
    return {
      status: error.status,
      category: error.category,
      message: error.message,
    };
  }

  if (error instanceof ZodError) {
    sendError(
      response,
      400,
      VALIDATION_ERROR_MESSAGE,
      formatZodError(error),
    );
    return {
      status: 400,
      category: "validation",
      message: VALIDATION_ERROR_MESSAGE,
    };
  }

  sendError(response, 500, INTERNAL_ERROR_MESSAGE);
  return {
    status: 500,
    category: "internal",
    message: INTERNAL_ERROR_MESSAGE,
  };
}
