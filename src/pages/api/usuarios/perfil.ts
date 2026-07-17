import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth } from "@/src/lib/auth/authenticate";
import {
  getAuthenticatedUserProfile,
  type AuthenticatedUserProfile,
  updateAuthenticatedUserProfile,
} from "@/src/lib/services/usuario-service";
import { updateProfileSchema } from "@/src/lib/validations/usuario";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const PROFILE_RETRIEVED_MESSAGE = "Perfil consultado correctamente.";
const PROFILE_UPDATED_MESSAGE = "Perfil actualizado correctamente.";

interface ProfileResponseData {
  usuario: AuthenticatedUserProfile;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<ProfileResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET", "PATCH"])) {
    return;
  }

  try {
    if (Object.keys(request.query).length > 0) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const auth = await requireAuth(request);
    const usuario =
      request.method === "GET"
        ? await getAuthenticatedUserProfile(auth.userId)
        : await updateAuthenticatedUserProfile(
            auth.userId,
            updateProfileSchema.parse(request.body),
          );

    sendSuccess(
      response,
      200,
      request.method === "GET"
        ? PROFILE_RETRIEVED_MESSAGE
        : PROFILE_UPDATED_MESSAGE,
      { usuario },
    );
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
