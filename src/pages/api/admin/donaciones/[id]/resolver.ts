import type { NextApiRequest, NextApiResponse } from "next";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { resolveAdminDonation } from "@/src/lib/services/administracion-service";
import { adminIdQuerySchema, adminResolutionSchema } from "@/src/lib/validations/administracion";
import { requireAdmin } from "@/src/middleware/admin";
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<unknown>>) { if (!validateHttpMethod(req, res, ["POST"])) return; try { const auth = await requireAdmin(req); const query = adminIdQuerySchema.safeParse(req.query); if (!query.success) throw new ApiError(400, "Datos inválidos."); const body = adminResolutionSchema.parse(req.body); sendSuccess(res, 200, "Donación resuelta correctamente.", await resolveAdminDonation(auth.userId, query.data.id, body.motivo)); } catch (error) { handleApiError(error, res); } }
