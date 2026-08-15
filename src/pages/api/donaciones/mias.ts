import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth } from "@/src/middleware/auth";
import {
  listOwnDonations,
  type OwnDonationsResult,
} from "@/src/lib/services/donacion-service";
import { listOwnDonationsQuerySchema } from "@/src/lib/validations/donaciones";

const OWN_DONATIONS_RETRIEVED_MESSAGE =
  "Donaciones propias consultadas correctamente.";
const INVALID_DATA_MESSAGE = "Datos inválidos.";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<OwnDonationsResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) {
    return;
  }

  try {
    const auth = await requireAuth(request);
    const parsedQuery = listOwnDonationsQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const result = await listOwnDonations(auth.userId, parsedQuery.data);

    sendSuccess(response, 200, OWN_DONATIONS_RETRIEVED_MESSAGE, result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
