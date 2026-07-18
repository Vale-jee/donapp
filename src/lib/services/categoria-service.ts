import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import { ApiError } from "@/src/lib/api/errors";
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

export function listActiveCategories(): Promise<PublicCategory[]> {
  return prisma.categoria.findMany({
    where: {
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<AdministrativeCategory> {
  try {
    return await prisma.$transaction(
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
