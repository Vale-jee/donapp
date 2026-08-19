import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  cancelRequest,
  type RequestResult,
} from "@/src/lib/services/solicitud-service";
import {
  requestActionSchema,
  requestIdQuerySchema,
} from "@/src/lib/validations/solicitudes";
import { requireAuth } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RequestResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["PATCH"])) return;

  try {
    const auth = await requireAuth(request);
    const query = requestIdQuerySchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");
    requestActionSchema.parse(request.body);

    const result = await cancelRequest(auth.userId, query.data.id);
    sendSuccess(response, 200, "Solicitud cancelada correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
