import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth } from "@/src/lib/auth/authenticate";
import {
  createDonation,
  type CreatedDonation,
} from "@/src/lib/services/donacion-service";
import { createDonationSchema } from "@/src/lib/validations/donaciones";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const DONATION_CREATED_MESSAGE = "Donación creada correctamente.";

interface CreateDonationResponseData {
  donacion: CreatedDonation;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<CreateDonationResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  try {
    const auth = await requireAuth(request);

    if (Object.keys(request.query).length > 0) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const input = createDonationSchema.parse(request.body);
    const donacion = await createDonation(auth.userId, input);

    sendSuccess(response, 201, DONATION_CREATED_MESSAGE, {
      donacion,
    });
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
