import type { NextApiRequest, NextApiResponse } from "next";

import { handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { logoutUser } from "@/src/lib/services/auth-service";
import { logoutSchema } from "@/src/lib/validations/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<Record<string, never>>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  try {
    const input = logoutSchema.parse(request.body);
    await logoutUser(input);
    sendSuccess(response, 200, "Sesión cerrada correctamente.", {});
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
