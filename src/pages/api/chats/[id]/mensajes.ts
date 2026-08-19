import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  listMessages,
  sendMessage,
  type MessageResult,
  type MessagesPageResult,
} from "@/src/lib/services/chat-service";
import {
  chatIdQuerySchema,
  chatMessagesQuerySchema,
  sendMessageSchema,
} from "@/src/lib/validations/chats";
import { requireAuth, requireRole } from "@/src/middleware/auth";

type MessagesResponse = MessageResult | MessagesPageResult;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<MessagesResponse>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET", "POST"])) return;

  try {
    const auth = await requireAuth(request);
    requireRole(auth, ["USUARIO"]);

    if (request.method === "GET") {
      const query = chatMessagesQuerySchema.safeParse(request.query);
      if (!query.success) throw new ApiError(400, "Datos inválidos.");
      const { id, ...pagination } = query.data;
      const result = await listMessages(auth.userId, id, pagination);
      sendSuccess(response, 200, "Mensajes consultados correctamente.", result);
      return;
    }

    const query = chatIdQuerySchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");
    const input = sendMessageSchema.parse(request.body);
    const result = await sendMessage(auth.userId, query.data.id, input);
    sendSuccess(response, 201, "Mensaje enviado correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
