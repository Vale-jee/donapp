import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import { findActiveCategories } from "@/database/categorias";
import { ApiError } from "@/src/lib/api/errors";
import {
  getActiveCategoriesCache,
  invalidateActiveCategoriesCache,
  setActiveCategoriesCache,
} from "@/src/lib/cache/category-cache";
import type { CreateCategoryInput } from "@/src/lib/validations/categorias";

const CATEGORY_ALREADY_EXISTS_MESSAGE = "La categoría ya existe.";

const administrativeCategorySelect = {
  id: true,
  nombre: true,
  descripcion: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface PublicCategory {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface AdministrativeCategory extends PublicCategory {
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryCacheStatus = "HIT" | "MISS";

export interface ActiveCategoriesResult {
  categories: PublicCategory[];
  cacheStatus: CategoryCacheStatus;
}

export async function listActiveCategories(): Promise<ActiveCategoriesResult> {
  const cachedCategories = getActiveCategoriesCache();

  if (cachedCategories !== null) {
    return {
      categories: cachedCategories,
      cacheStatus: "HIT",
    };
  }

  const categories = await findActiveCategories();

  setActiveCategoriesCache(categories);

  return {
    categories,
    cacheStatus: "MISS",
  };
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<AdministrativeCategory> {
  try {
    const category = await prisma.$transaction(
      async (transaction) => {
        const duplicate = await transaction.categoria.findFirst({
          where: {
            nombre: {
              equals: input.nombre,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

        if (duplicate !== null) {
          throw new ApiError(409, CATEGORY_ALREADY_EXISTS_MESSAGE);
        }

        return transaction.categoria.create({
          data: {
            nombre: input.nombre,
            descripcion: input.descripcion ?? null,
            activo: true,
          },
          select: administrativeCategorySelect,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    invalidateActiveCategoriesCache();

    return category;
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      throw new ApiError(409, CATEGORY_ALREADY_EXISTS_MESSAGE);
    }

    throw error;
  }
}
