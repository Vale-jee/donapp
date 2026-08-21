import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth } from "@/src/middleware/auth";
import {
  DONATION_CREATED_JOB_NAME,
  DonationQueueUnavailableError,
  enqueueDonationCreated,
} from "@/src/lib/queue/donation-queue";
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
  procesamientoAsincrono: {
    estado: "ENQUEUED" | "PENDING_RECONCILIATION";
  };
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
        auth.city,
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

    let asyncProcessingStatus: "ENQUEUED" | "PENDING_RECONCILIATION" =
      "ENQUEUED";

    try {
      await enqueueDonationCreated({
        donationId: donacion.id,
        userId: auth.userId,
        createdAt: donacion.createdAt.toISOString(),
      });
    } catch (error: unknown) {
      if (error instanceof DonationQueueUnavailableError) {
        asyncProcessingStatus = "PENDING_RECONCILIATION";
        console.error(
          JSON.stringify({
            level: "error",
            event: "queue_enqueue_failed",
            jobName: DONATION_CREATED_JOB_NAME,
            donationId: donacion.id,
            requestId: request.headers["x-request-id"] ?? null,
            failureType: error.name,
            timestamp: new Date().toISOString(),
          }),
        );
      } else {
        throw error;
      }
    }

    sendSuccess(response, 201, DONATION_CREATED_MESSAGE, {
      donacion,
      procesamientoAsincrono: { estado: asyncProcessingStatus },
    });
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
