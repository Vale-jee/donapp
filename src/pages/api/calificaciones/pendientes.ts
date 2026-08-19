import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  listPendingRatings,
  type PendingRatingsResult,
} from "@/src/lib/services/calificacion-service";
import { ratingsPaginationSchema } from "@/src/lib/validations/calificaciones";
import { requireAuth, requireRole } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<PendingRatingsResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) return;

  try {
    const auth = await requireAuth(request);
    requireRole(auth, ["USUARIO"]);
    const query = ratingsPaginationSchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");

    const result = await listPendingRatings(auth.userId, query.data);
    sendSuccess(
      response,
      200,
      "Calificaciones pendientes consultadas correctamente.",
      result,
    );
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
