import type { NextApiRequest, NextApiResponse } from "next";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { changeAdminUserState } from "@/src/lib/services/administracion-service";
import { adminIdQuerySchema, adminStateSchema } from "@/src/lib/validations/administracion";
import { requireAdmin } from "@/src/middleware/admin";
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<unknown>>) { if (!validateHttpMethod(req, res, ["PATCH"])) return; try { const auth = await requireAdmin(req); const query = adminIdQuerySchema.safeParse(req.query); if (!query.success) throw new ApiError(400, "Datos inválidos."); const body = adminStateSchema.parse(req.body); sendSuccess(res, 200, body.activo ? "Usuario reactivado correctamente." : "Usuario desactivado correctamente.", await changeAdminUserState(auth.userId, query.data.id, body.activo, body.motivo)); } catch (error) { handleApiError(error, res); } }
