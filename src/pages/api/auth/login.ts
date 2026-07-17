import type { NextApiRequest, NextApiResponse } from "next";

import { handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  loginUser,
  type LoginResult,
} from "@/src/lib/services/auth-service";
import { loginSchema } from "@/src/lib/validations/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<LoginResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  try {
    const input = loginSchema.parse(request.body);
    const result = await loginUser(input);
    sendSuccess(response, 200, "Sesión iniciada correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
