import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth } from "@/src/lib/auth/authenticate";
import {
  getAuthenticatedUserProfile,
  type AuthenticatedUserProfile,
} from "@/src/lib/services/usuario-service";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const PROFILE_RETRIEVED_MESSAGE = "Perfil consultado correctamente.";

interface ProfileResponseData {
  usuario: AuthenticatedUserProfile;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<ProfileResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) {
    return;
  }

  try {
    if (Object.keys(request.query).length > 0) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const auth = await requireAuth(request);
    const usuario = await getAuthenticatedUserProfile(auth.userId);

    sendSuccess(response, 200, PROFILE_RETRIEVED_MESSAGE, { usuario });
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
