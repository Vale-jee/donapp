import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  createRating,
  getDonationRating,
  type RatingResult,
} from "@/src/lib/services/calificacion-service";
import {
  createRatingSchema,
  ratingIdQuerySchema,
} from "@/src/lib/validations/calificaciones";
import { requireAuth, requireRole } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RatingResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET", "POST"])) return;

  try {
    const auth = await requireAuth(request);
    requireRole(auth, ["USUARIO"]);
    const query = ratingIdQuerySchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");

    if (request.method === "GET") {
      const result = await getDonationRating(auth.userId, query.data.id);
      sendSuccess(response, 200, "Calificación consultada correctamente.", result);
      return;
    }

    const input = createRatingSchema.parse(request.body);
    const result = await createRating(auth.userId, query.data.id, input);
    sendSuccess(response, 201, "Calificación creada correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
