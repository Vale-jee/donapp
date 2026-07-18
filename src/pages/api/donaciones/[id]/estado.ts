import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth } from "@/src/lib/auth/authenticate";
import {
  withdrawDonation,
  type WithdrawDonationResult,
} from "@/src/lib/services/donacion-service";
import {
  donationDetailQuerySchema,
  withdrawDonationSchema,
} from "@/src/lib/validations/donaciones";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const DONATION_WITHDRAWN_MESSAGE = "Donación retirada correctamente.";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<WithdrawDonationResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["PATCH"])) {
    return;
  }

  try {
    const auth = await requireAuth(request);
    const parsedQuery = donationDetailQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    withdrawDonationSchema.parse(request.body);
    const result = await withdrawDonation(auth.userId, parsedQuery.data.id);

    sendSuccess(response, 200, DONATION_WITHDRAWN_MESSAGE, result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
