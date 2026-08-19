import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  confirmDonationDelivery,
  type DeliveryConfirmationResult,
} from "@/src/lib/services/donacion-service";
import {
  confirmDeliverySchema,
  donationDetailQuerySchema,
} from "@/src/lib/validations/donaciones";
import { requireAuth } from "@/src/middleware/auth";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const DELIVERY_CONFIRMED_MESSAGE = "Entrega confirmada correctamente.";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<DeliveryConfirmationResult>>,
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

    confirmDeliverySchema.parse(request.body);
    const result = await confirmDonationDelivery(
      auth.userId,
      parsedQuery.data.id,
    );

    sendSuccess(response, 200, DELIVERY_CONFIRMED_MESSAGE, result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
