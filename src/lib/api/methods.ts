import type { NextApiRequest, NextApiResponse } from "next";

import { sendError, type ApiResponse } from "./responses";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export function validateHttpMethod<T = never>(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<T>>,
  allowedMethods: readonly HttpMethod[],
): boolean {
  if (allowedMethods.some((method) => method === request.method)) {
    return true;
  }

  response.setHeader("Allow", allowedMethods);
  sendError(response, 405, "Método HTTP no permitido");
  return false;
}
