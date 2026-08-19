import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { getChat, type ChatResult } from "@/src/lib/services/chat-service";
import { chatIdQuerySchema } from "@/src/lib/validations/chats";
import { requireAuth, requireRole } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<ChatResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) return;

  try {
    const auth = await requireAuth(request);
    requireRole(auth, ["USUARIO"]);
    const query = chatIdQuerySchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");

    const result = await getChat(auth.userId, query.data.id);
    sendSuccess(response, 200, "Chat consultado correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
