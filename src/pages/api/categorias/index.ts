import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import { requireAuth, requireRole } from "@/src/middleware/auth";
import {
  createCategory,
  type AdministrativeCategory,
  listActiveCategories,
  type PublicCategory,
} from "@/src/lib/services/categoria-service";
import { createCategorySchema } from "@/src/lib/validations/categorias";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const CATEGORIES_RETRIEVED_MESSAGE =
  "Categorias consultadas correctamente.";
const CATEGORY_CREATED_MESSAGE = "Categoria creada correctamente.";

interface CategoriesRetrievedResponseData {
  categorias: PublicCategory[];
}

interface CategoryCreatedResponseData {
  categoria: AdministrativeCategory;
}

type CategoriesResponseData =
  | CategoriesRetrievedResponseData
  | CategoryCreatedResponseData;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<CategoriesResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET", "POST"])) {
    return;
  }

  try {
    if (request.method === "GET") {
      if (Object.keys(request.query).length > 0) {
        throw new ApiError(400, INVALID_DATA_MESSAGE);
      }

      const { categories: categorias, cacheStatus } =
        await listActiveCategories();

      response.setHeader("X-Cache-Status", cacheStatus);

      sendSuccess(response, 200, CATEGORIES_RETRIEVED_MESSAGE, {
        categorias,
      });
      return;
    }

    const auth = await requireAuth(request);
    requireRole(auth, ["ADMIN"]);

    if (Object.keys(request.query).length > 0) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const input = createCategorySchema.parse(request.body);
    const categoria = await createCategory(input);

    sendSuccess(response, 201, CATEGORY_CREATED_MESSAGE, {
      categoria,
    });
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
