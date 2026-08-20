import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { changeAuthenticatedUserPassword } from "@/src/lib/services/usuario-service";
import { changePasswordSchema } from "@/src/lib/validations/usuario";
import { requireAuth } from "@/src/middleware/auth";

const PASSWORD_UPDATED_MESSAGE =
  "Contraseña actualizada correctamente. Debe iniciar sesión nuevamente.";
const INVALID_DATA_MESSAGE = "Datos inválidos.";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<Record<string, never>>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["PUT"])) {
    return;
  }

  try {
    if (Object.keys(request.query).length > 0) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const auth = await requireAuth(request);
    const input = changePasswordSchema.parse(request.body);
    await changeAuthenticatedUserPassword(auth.userId, input);
    sendSuccess(response, 200, PASSWORD_UPDATED_MESSAGE, {});
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
