import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import {
  ADMINISTRATIVE_CATEGORY_SELECT,
  findActiveCategories,
  findActiveCategoryById,
  findAdministrativeCategoryById,
} from "@/database/categorias";
import { ApiError } from "@/src/lib/api/errors";
import {
  getActiveCategoriesCache,
  invalidateActiveCategoriesCache,
  setActiveCategoriesCache,
} from "@/src/lib/cache/category-cache";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategoryStateInput,
} from "@/src/lib/validations/categorias";

const CATEGORY_ALREADY_EXISTS_MESSAGE = "La categoría ya existe.";
const CATEGORY_NOT_FOUND_MESSAGE = "Categoría no encontrada.";
const CATEGORY_CHANGED_MESSAGE =
  "La categoría cambió mientras se procesaba la operación.";

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

export async function getPublicCategory(
  categoryId: number,
): Promise<PublicCategory> {
  const category = await findActiveCategoryById(categoryId);

  if (category === null) {
    throw new ApiError(404, CATEGORY_NOT_FOUND_MESSAGE);
  }

  return category;
}

export async function getAdministrativeCategory(
  categoryId: number,
): Promise<AdministrativeCategory> {
  const category = await findAdministrativeCategoryById(categoryId);

  if (category === null) {
    throw new ApiError(404, CATEGORY_NOT_FOUND_MESSAGE);
  }

  return category;
}

function translateCategoryMutationError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new ApiError(409, CATEGORY_ALREADY_EXISTS_MESSAGE);
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    throw new ApiError(409, CATEGORY_CHANGED_MESSAGE);
  }

  throw error;
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
          select: ADMINISTRATIVE_CATEGORY_SELECT,
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

export async function updateCategory(
  categoryId: number,
  input: UpdateCategoryInput,
): Promise<AdministrativeCategory> {
  try {
    const category = await prisma.$transaction(
      async (transaction) => {
        const current = await transaction.categoria.findUnique({
          where: { id: categoryId },
          select: { id: true, nombre: true },
        });

        if (current === null) {
          throw new ApiError(404, CATEGORY_NOT_FOUND_MESSAGE);
        }

        if (input.nombre !== undefined) {
          const duplicate = await transaction.categoria.findFirst({
            where: {
              id: { not: current.id },
              nombre: { equals: input.nombre, mode: "insensitive" },
            },
            select: { id: true },
          });

          if (duplicate !== null) {
            throw new ApiError(409, CATEGORY_ALREADY_EXISTS_MESSAGE);
          }
        }

        return transaction.categoria.update({
          where: { id: current.id },
          data: {
            ...(input.nombre === undefined ? {} : { nombre: input.nombre }),
            ...(input.descripcion === undefined
              ? {}
              : { descripcion: input.descripcion }),
          },
          select: ADMINISTRATIVE_CATEGORY_SELECT,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    invalidateActiveCategoriesCache();
    return category;
  } catch (error: unknown) {
    translateCategoryMutationError(error);
  }
}

export async function updateCategoryState(
  categoryId: number,
  input: UpdateCategoryStateInput,
): Promise<AdministrativeCategory> {
  try {
    const category = await prisma.$transaction(
      async (transaction) => {
        const current = await transaction.categoria.findUnique({
          where: { id: categoryId },
          select: { id: true, activo: true },
        });

        if (current === null) {
          throw new ApiError(404, CATEGORY_NOT_FOUND_MESSAGE);
        }

        if (current.activo === input.activo) {
          return transaction.categoria.findUniqueOrThrow({
            where: { id: current.id },
            select: ADMINISTRATIVE_CATEGORY_SELECT,
          });
        }

        const updated = await transaction.categoria.updateMany({
          where: { id: current.id, activo: current.activo },
          data: { activo: input.activo },
        });

        if (updated.count !== 1) {
          throw new ApiError(409, CATEGORY_CHANGED_MESSAGE);
        }

        return transaction.categoria.findUniqueOrThrow({
          where: { id: current.id },
          select: ADMINISTRATIVE_CATEGORY_SELECT,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    invalidateActiveCategoriesCache();
    return category;
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      const current = await findAdministrativeCategoryById(categoryId);

      if (current?.activo === input.activo) {
        invalidateActiveCategoriesCache();
        return current;
      }
    }

    translateCategoryMutationError(error);
  }
}
