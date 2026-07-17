import type { NextApiRequest, NextApiResponse } from "next";

import { handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  refreshTokens,
  type RefreshResult,
} from "@/src/lib/services/auth-service";
import { refreshSchema } from "@/src/lib/validations/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RefreshResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  try {
    const input = refreshSchema.parse(request.body);
    const result = await refreshTokens(input);
    sendSuccess(response, 200, "Tokens renovados correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
