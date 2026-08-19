import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  listReceivedRequests,
  type RequestsPageResult,
} from "@/src/lib/services/solicitud-service";
import { listRequestsQuerySchema } from "@/src/lib/validations/solicitudes";
import { requireAuth } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RequestsPageResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) return;

  try {
    const auth = await requireAuth(request);
    const query = listRequestsQuerySchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");

    const result = await listReceivedRequests(auth.userId, query.data);
    sendSuccess(response, 200, "Solicitudes recibidas consultadas correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
