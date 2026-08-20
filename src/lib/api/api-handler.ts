import { randomUUID } from "node:crypto";

import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "./errors";
import { logApiRequest } from "./logger";
import type { ApiResponse } from "./responses";

const MAX_JSON_BODY_BYTES = 1024 * 1024;
const MALFORMED_JSON_MESSAGE = "El cuerpo JSON no es válido.";

type ApiHandler<T> = (
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<T>>,
) => Promise<void> | void;

export interface ApiHandlerOptions {
  parseJsonBody?: boolean;
  beforeHandler?: (
    request: NextApiRequest,
    response: NextApiResponse,
  ) => Promise<void>;
}

function getRoute(request: NextApiRequest): string {
  return request.url?.split("?", 1)[0] ?? "unknown";
}

async function parseJsonBody(request: NextApiRequest): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > MAX_JSON_BODY_BYTES) {
      throw new ApiError(400, MALFORMED_JSON_MESSAGE, "validation");
    }

    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (rawBody.trim() === "") {
    return undefined;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new ApiError(400, MALFORMED_JSON_MESSAGE, "validation");
  }
}

export function withApiInfrastructure<T>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {},
): ApiHandler<T> {
  return async (request, response) => {
    const internalRequestId = request.headers["x-donapp-request-id"];
    const requestId =
      typeof internalRequestId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        internalRequestId,
      )
        ? internalRequestId
        : randomUUID();
    const startedAt = performance.now();
    let category = "success";
    let message = "Solicitud procesada.";

    response.setHeader("X-Request-ID", requestId);
    request.headers["x-request-id"] = requestId;

    try {
      if (options.parseJsonBody === true && request.method === "POST") {
        request.body = await parseJsonBody(request);
      }

      await options.beforeHandler?.(request, response);
      await handler(request, response);

      if (response.statusCode >= 400) {
        category = "http_error";
        message = "Solicitud rechazada.";
      }
    } catch (error: unknown) {
      const handled = handleApiError(error, response);
      category = handled.category;
      message = handled.message;
    } finally {
      logApiRequest({
        requestId,
        method: request.method ?? "UNKNOWN",
        route: getRoute(request),
        status: response.statusCode,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
        category,
        message,
      });
    }
  };
}
