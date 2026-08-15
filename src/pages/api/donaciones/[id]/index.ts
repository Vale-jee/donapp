import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth } from "@/src/middleware/auth";
import {
  getDonationDetail,
  type DonationDetailResult,
  updateDonation,
} from "@/src/lib/services/donacion-service";
import {
  donationDetailQuerySchema,
  updateDonationSchema,
} from "@/src/lib/validations/donaciones";

const DONATION_RETRIEVED_MESSAGE = "Donación consultada correctamente.";
const DONATION_UPDATED_MESSAGE = "Donación actualizada correctamente.";
const INVALID_DATA_MESSAGE = "Datos inválidos.";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<DonationDetailResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET", "PATCH"])) {
    return;
  }

  try {
    const auth = await requireAuth(request);
    const parsedQuery = donationDetailQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    if (request.method === "GET") {
      const result = await getDonationDetail(auth.userId, parsedQuery.data);

      sendSuccess(response, 200, DONATION_RETRIEVED_MESSAGE, result);
      return;
    }

    const input = updateDonationSchema.parse(request.body);
    const result = await updateDonation(
      auth.userId,
      parsedQuery.data.id,
      input,
    );

    sendSuccess(response, 200, DONATION_UPDATED_MESSAGE, result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
