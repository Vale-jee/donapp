import type { NextApiRequest, NextApiResponse } from "next";

import { withApiInfrastructure } from "@/src/lib/api/api-handler";
import { createSignedImageUpload, type SignedImageUpload } from "@/src/lib/cloudinary/signed-upload";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { IMAGE_RATE_LIMIT_POLICY, createIpRateLimit } from "@/src/lib/security/rate-limit";
import { requireAuth } from "@/src/middleware/auth";

async function signedUploadHandler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<SignedImageUpload>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) return;
  await requireAuth(request);
  const authorization = createSignedImageUpload();
  sendSuccess(response, 200, "Carga de imagen autorizada.", authorization);
}

export const config = { api: { bodyParser: false } };

export default withApiInfrastructure(signedUploadHandler, {
  beforeHandler: createIpRateLimit(IMAGE_RATE_LIMIT_POLICY),
});
