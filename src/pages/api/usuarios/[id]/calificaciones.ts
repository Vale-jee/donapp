import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  listReceivedRatings,
  type ReceivedRatingsResult,
} from "@/src/lib/services/calificacion-service";
import { userRatingsQuerySchema } from "@/src/lib/validations/calificaciones";
import { requireAuth } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<ReceivedRatingsResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) return;

  try {
    await requireAuth(request);
    const query = userRatingsQuerySchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");
    const { id, ...pagination } = query.data;

    const result = await listReceivedRatings(id, pagination);
    sendSuccess(response, 200, "Calificaciones consultadas correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
