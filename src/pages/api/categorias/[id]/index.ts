import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  getAdministrativeCategory,
  getPublicCategory,
  type AdministrativeCategory,
  type PublicCategory,
  updateCategory,
} from "@/src/lib/services/categoria-service";
import {
  categoryIdQuerySchema,
  updateCategorySchema,
} from "@/src/lib/validations/categorias";
import { requireAdmin } from "@/src/middleware/admin";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const CATEGORY_RETRIEVED_MESSAGE = "Categoria consultada correctamente.";
const CATEGORY_UPDATED_MESSAGE = "Categoria actualizada correctamente.";

interface CategoryResponseData {
  categoria: PublicCategory | AdministrativeCategory;
}

function hasAuthorizationHeader(request: NextApiRequest): boolean {
  return request.rawHeaders.some(
    (value, index) =>
      index % 2 === 0 && value.toLowerCase() === "authorization",
  );
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<CategoryResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET", "PATCH"])) {
    return;
  }

  try {
    const query = categoryIdQuerySchema.safeParse(request.query);

    if (!query.success) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    if (request.method === "GET" && !hasAuthorizationHeader(request)) {
      const categoria = await getPublicCategory(query.data.id);
      sendSuccess(response, 200, CATEGORY_RETRIEVED_MESSAGE, { categoria });
      return;
    }

    await requireAdmin(request);

    const categoria =
      request.method === "GET"
        ? await getAdministrativeCategory(query.data.id)
        : await updateCategory(
            query.data.id,
            updateCategorySchema.parse(request.body),
          );

    sendSuccess(
      response,
      200,
      request.method === "GET"
        ? CATEGORY_RETRIEVED_MESSAGE
        : CATEGORY_UPDATED_MESSAGE,
      { categoria },
    );
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
