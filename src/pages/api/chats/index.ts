import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  listChats,
  type ChatsPageResult,
} from "@/src/lib/services/chat-service";
import { chatPaginationSchema } from "@/src/lib/validations/chats";
import { requireAuth, requireRole } from "@/src/middleware/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<ChatsPageResult>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) return;

  try {
    const auth = await requireAuth(request);
    requireRole(auth, ["USUARIO"]);
    const query = chatPaginationSchema.safeParse(request.query);
    if (!query.success) throw new ApiError(400, "Datos inválidos.");

    const result = await listChats(auth.userId, query.data);
    sendSuccess(response, 200, "Chats consultados correctamente.", result);
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
