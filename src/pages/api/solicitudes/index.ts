import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  createRequest,
  type RequestResult,
} from "@/src/lib/services/solicitud-service";
import { createRequestSchema } from "@/src/lib/validations/solicitudes";
import { requireAuth } from "@/src/middleware/auth";

const INVALID_DATA_MESSAGE = "Datos inválidos.";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RequestResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  try {
    if (Object.keys(request.query).length > 0) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const auth = await requireAuth(request);
    const input = createRequestSchema.parse(request.body);
    const result = await createRequest(auth.userId, auth.city, input);

    sendSuccess(response, 201, "Solicitud creada correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
