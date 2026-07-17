import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { validateHttpMethod } from "@/src/lib/api/methods";
import { sendSuccess, type ApiResponse } from "@/src/lib/api/responses";
import {
  listActiveCategories,
  type PublicCategory,
} from "@/src/lib/services/categoria-service";

const INVALID_DATA_MESSAGE = "Datos inválidos.";
const CATEGORIES_RETRIEVED_MESSAGE =
  "Categorias consultadas correctamente.";

interface CategoriesResponseData {
  categorias: PublicCategory[];
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiResponse<CategoriesResponseData>>,
): Promise<void> {
  if (!validateHttpMethod(request, response, ["GET"])) {
    return;
  }

  try {
    if (Object.keys(request.query).length > 0) {
      throw new ApiError(400, INVALID_DATA_MESSAGE);
    }

    const categorias = await listActiveCategories();

    sendSuccess(response, 200, CATEGORIES_RETRIEVED_MESSAGE, {
      categorias,
    });
  } catch (error: unknown) {
    handleApiError(error, response);
  }
}
