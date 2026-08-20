import type { NextApiRequest, NextApiResponse } from "next";

import { withApiInfrastructure } from "@/src/lib/api/api-handler";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { logoutUser } from "@/src/lib/services/auth-service";
import { logoutSchema } from "@/src/lib/validations/auth";

async function logoutHandler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<Record<string, never>>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) {
    return;
  }

  const input = logoutSchema.parse(request.body);
  await logoutUser(input);
  sendSuccess(response, 200, "Sesión cerrada correctamente.", {});
}

export const config = { api: { bodyParser: false } };

export default withApiInfrastructure(logoutHandler, { parseJsonBody: true });
