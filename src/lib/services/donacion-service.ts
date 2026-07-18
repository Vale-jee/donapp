import { EstadoDonacion } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import { ApiError } from "@/src/lib/api/errors";
import type { CreateDonationInput } from "@/src/lib/validations/donaciones";

const INVALID_ACCESS_TOKEN_MESSAGE = "Access token inválido.";
const INVALID_CITY_MESSAGE =
  "Debe completar una ciudad válida en su perfil antes de publicar una donación.";
const CATEGORY_NOT_FOUND_MESSAGE = "Categoría no encontrada.";
const INACTIVE_CATEGORY_MESSAGE =
  "La categoría seleccionada no está activa.";

export interface CreatedDonation {
  id: number;
  titulo: string;
  descripcion: string;
  ciudad: string;
  estado: EstadoDonacion;
  createdAt: Date;
  updatedAt: Date;
  categoria: {
    id: number;
    nombre: string;
  };
  imagenes: Array<{
    id: number;
    referencia: string;
    orden: number;
  }>;
}

export async function createDonation(
  userId: number,
  input: CreateDonationInput,
): Promise<CreatedDonation> {
  return prisma.$transaction(async (transaction) => {
    const [user, category] = await Promise.all([
      transaction.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          ciudad: true,
        },
      }),
      transaction.categoria.findUnique({
        where: { id: input.categoriaId },
        select: {
          id: true,
          activo: true,
        },
      }),
    ]);

    if (user === null) {
      throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
    }

    const city = user.ciudad?.trim();

    if (city === undefined || city.length === 0) {
      throw new ApiError(409, INVALID_CITY_MESSAGE);
    }

    if (category === null) {
      throw new ApiError(404, CATEGORY_NOT_FOUND_MESSAGE);
    }

    if (!category.activo) {
      throw new ApiError(409, INACTIVE_CATEGORY_MESSAGE);
    }

    return transaction.donacion.create({
      data: {
        titulo: input.titulo,
        descripcion: input.descripcion,
        ciudad: city,
        estado: EstadoDonacion.PUBLICADA,
        propietarioId: user.id,
        categoriaId: category.id,
        imagenes: {
          create: input.imagenes.map((referencia, index) => ({
            referencia,
            orden: index + 1,
          })),
        },
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        ciudad: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
        imagenes: {
          select: {
            id: true,
            referencia: true,
            orden: true,
          },
          orderBy: {
            orden: "asc",
          },
        },
      },
    });
  });
}
