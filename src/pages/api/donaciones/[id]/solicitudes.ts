import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  listDonationRequests,
  type RequestsPageResult,
} from "@/src/lib/services/solicitud-service";
import {
  listRequestsQuerySchema,
  requestIdQuerySchema,
} from "@/src/lib/validations/solicitudes";
import { requireAuth } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RequestsPageResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) return;

  try {
    const auth = await requireAuth(request);
    const allowedQueryKeys = new Set(["id", "page", "limit", "estado"]);

    if (Object.keys(request.query).some((key) => !allowedQueryKeys.has(key))) {
      throw new ApiError(400, "Datos inválidos.");
    }

    const idQuery = requestIdQuerySchema.safeParse({ id: request.query.id });
    const listQuery = listRequestsQuerySchema.safeParse({
      page: request.query.page,
      limit: request.query.limit,
      estado: request.query.estado,
    });

    if (!idQuery.success || !listQuery.success) {
      throw new ApiError(400, "Datos inválidos.");
    }

    const result = await listDonationRequests(
      auth.userId,
      idQuery.data.id,
      listQuery.data,
    );
    sendSuccess(response, 200, "Solicitudes de la donación consultadas correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
