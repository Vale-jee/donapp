import type { NextApiRequest, NextApiResponse } from "next";

import { withApiInfrastructure } from "@/src/lib/api/api-handler";
import { ApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  loginUser,
  type LoginResult,
} from "@/src/lib/services/auth-service";
import {
  AUTH_RATE_LIMIT_POLICIES,
  assertLoginEmailNotBlocked,
  clearLoginFailures,
  createIpRateLimit,
  recordLoginFailure,
} from "@/src/lib/security/rate-limit";
import { loginSchema } from "@/src/lib/validations/auth";

async function loginHandler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<LoginResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  const input = loginSchema.parse(request.body);
  await assertLoginEmailNotBlocked(input.email, response);

  try {
    const result = await loginUser(input);
    await clearLoginFailures(input.email);
    sendSuccess(response, 200, "Sesión iniciada correctamente.", result);
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      await recordLoginFailure(input.email, response);
    }

    throw error;
  }
}

export const config = { api: { bodyParser: false } };

export default withApiInfrastructure(loginHandler, {
  parseJsonBody: true,
  beforeHandler: createIpRateLimit(AUTH_RATE_LIMIT_POLICIES.login),
});
