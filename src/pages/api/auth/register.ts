import type { NextApiRequest, NextApiResponse } from "next";

import { handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { registerUser } from "@/src/lib/services/auth-service";
import { registerSchema } from "@/src/lib/validations/auth";

type RegisterResponseData = Record<string, never>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RegisterResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  try {
    const input = registerSchema.parse(request.body);
    await registerUser(input);
    sendSuccess(response, 201, "Usuario registrado correctamente.", {});
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
