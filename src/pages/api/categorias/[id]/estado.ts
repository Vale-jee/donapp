import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  type AdministrativeCategory,
  updateCategoryState,
} from "@/src/lib/services/categoria-service";
import {
  categoryIdQuerySchema,
  updateCategoryStateSchema,
} from "@/src/lib/validations/categorias";
import { requireAdmin } from "@/src/middleware/admin";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const CATEGORY_STATE_UPDATED_MESSAGE =
  "Estado de la categoria actualizado correctamente.";

interface CategoryStateResponseData {
  categoria: AdministrativeCategory;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<CategoryStateResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["PATCH"])) {
    return;
  }

  try {
    const query = categoryIdQuerySchema.safeParse(request.query);

    if (!query.success) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    await requireAdmin(request);
    const input = updateCategoryStateSchema.parse(request.body);
    const categoria = await updateCategoryState(query.data.id, input);
    sendSuccess(response, 200, CATEGORY_STATE_UPDATED_MESSAGE, { categoria });
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
