import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  getPublicUserProfile,
  type PublicUserProfile,
} from "@/src/lib/services/usuario-service";
import { publicProfileQuerySchema } from "@/src/lib/validations/usuario";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const PROFILE_RETRIEVED_MESSAGE = "Perfil público consultado correctamente.";

interface PublicProfileResponseData {
  usuario: PublicUserProfile;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<PublicProfileResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) {
    return;
  }

  try {
    const query = publicProfileQuerySchema.safeParse(request.query);

    if (!query.success) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const usuario = await getPublicUserProfile(query.data.id);
    sendSuccess(response, 200, PROFILE_RETRIEVED_MESSAGE, { usuario });
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
