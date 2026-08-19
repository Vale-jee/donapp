import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  getOrCreateChat,
  type ChatResult,
} from "@/src/lib/services/chat-service";
import { createChatSchema } from "@/src/lib/validations/chats";
import { requestIdQuerySchema } from "@/src/lib/validations/solicitudes";
import { requireAuth, requireRole } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<ChatResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["POST"])) return;

  try {
    const auth = await requireAuth(request);
    requireRole(auth, ["USUARIO"]);
    const query = requestIdQuerySchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");
    createChatSchema.parse(request.body);

    const result = await getOrCreateChat(auth.userId, query.data.id);
    sendSuccess(
      response,
      result.created ? 201 : 200,
      result.created ? "Chat creado correctamente." : "Chat consultado correctamente.",
      { chat: result.chat },
    );
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
