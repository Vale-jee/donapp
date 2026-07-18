import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth } from "@/src/lib/auth/authenticate";
import {
  createDonation,
  listAvailableDonations,
  type AvailableDonationsResult,
  type CreatedDonation,
} from "@/src/lib/services/donacion-service";
import {
  createDonationSchema,
  listAvailableDonationsQuerySchema,
} from "@/src/lib/validations/donaciones";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const DONATION_CREATED_MESSAGE = "Donación creada correctamente.";
const AVAILABLE_DONATIONS_RETRIEVED_MESSAGE =
  "Donaciones disponibles consultadas correctamente.";

interface CreateDonationResponseData {
  donacion: CreatedDonation;
}

type DonationsResponseData =
  | CreateDonationResponseData
  | AvailableDonationsResult;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<DonationsResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET", "POST"])) {
    return;
  }

  try {
    const auth = await requireAuth(request);

    if (request.method === "GET") {
      const parsedQuery = listAvailableDonationsQuerySchema.safeParse(
        request.query,
      );

      if (!parsedQuery.success) {
        throw new ApiError(400, INVALID_DATA_MESSAGE);
      }

      const result = await listAvailableDonations(
        auth.userId,
        parsedQuery.data,
      );

      sendSuccess(
        response,
        200,
        AVAILABLE_DONATIONS_RETRIEVED_MESSAGE,
        result,
      );
      return;
    }

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
