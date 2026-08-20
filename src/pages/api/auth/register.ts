import type { NextApiRequest, NextApiResponse } from "next";

import { withApiInfrastructure } from "@/src/lib/api/api-handler";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { registerUser } from "@/src/lib/services/auth-service";
import {
  AUTH_RATE_LIMIT_POLICIES,
  createIpRateLimit,
} from "@/src/lib/security/rate-limit";
import { registerSchema } from "@/src/lib/validations/auth";

type RegisterResponseData = Record<string, never>;

async function registerHandler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RegisterResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  const input = registerSchema.parse(request.body);
  await registerUser(input);
  sendSuccess(response, 201, "Usuario registrado correctamente.", {});
}

export const config = { api: { bodyParser: false } };

export default withApiInfrastructure(registerHandler, {
  parseJsonBody: true,
  beforeHandler: createIpRateLimit(AUTH_RATE_LIMIT_POLICIES.register),
});
