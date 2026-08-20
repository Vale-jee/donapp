import type { NextApiRequest, NextApiResponse } from "next";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { getAdminChats } from "@/src/lib/services/administracion-service";
import { adminChatsQuerySchema } from "@/src/lib/validations/administracion";
import { requireAdmin } from "@/src/middleware/admin";
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<unknown>>) { if (!validateHttpMethod(req, res, ["GET"])) return; try { await requireAdmin(req); const query = adminChatsQuerySchema.safeParse(req.query); if (!query.success) throw new ApiError(400, "Datos inválidos."); sendSuccess(res, 200, "Chats consultados correctamente.", await getAdminChats(query.data)); } catch (error) { handleApiError(error, res); } }
