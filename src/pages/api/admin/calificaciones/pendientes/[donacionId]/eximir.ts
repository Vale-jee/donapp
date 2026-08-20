import type { NextApiRequest, NextApiResponse } from "next";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { exemptPendingRating } from "@/src/lib/services/administracion-service";
import { adminDonationIdQuerySchema, adminReasonBodySchema } from "@/src/lib/validations/administracion";
import { requireAdmin } from "@/src/middleware/admin";
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<unknown>>) { if (!validateHttpMethod(req, res, ["POST"])) return; try { const auth = await requireAdmin(req); const query = adminDonationIdQuerySchema.safeParse(req.query); if (!query.success) throw new ApiError(400, "Datos inválidos."); const body = adminReasonBodySchema.parse(req.body); const result = await exemptPendingRating(auth.userId, query.data.donacionId, body.motivo); sendSuccess(res, result.creada ? 201 : 200, result.creada ? "Exención creada correctamente." : "Exención consultada correctamente.", { exencion: result.exencion }); } catch (error) { handleApiError(error, res); } }
