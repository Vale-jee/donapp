import type { NextApiRequest, NextApiResponse } from "next";

import { withApiInfrastructure } from "@/src/lib/api/api-handler";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  refreshTokens,
  type RefreshResult,
} from "@/src/lib/services/auth-service";
import {
  AUTH_RATE_LIMIT_POLICIES,
  createIpRateLimit,
} from "@/src/lib/security/rate-limit";
import { refreshSchema } from "@/src/lib/validations/auth";

async function refreshHandler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<RefreshResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  const input = refreshSchema.parse(request.body);
  const result = await refreshTokens(input);
  sendSuccess(response, 200, "Tokens renovados correctamente.", result);
}

export const config = { api: { bodyParser: false } };

export default withApiInfrastructure(refreshHandler, {
  parseJsonBody: true,
  beforeHandler: createIpRateLimit(AUTH_RATE_LIMIT_POLICIES.refresh),
});
