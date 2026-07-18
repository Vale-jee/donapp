import { EstadoDonacion } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import { ApiError } from "@/src/lib/api/errors";
import type {
  CreateDonationInput,
  ListAvailableDonationsQuery,
  ListOwnDonationsQuery,
} from "@/src/lib/validations/donaciones";

const INVALID_ACCESS_TOKEN_MESSAGE = "Access token inválido.";
const INVALID_CITY_MESSAGE =
  "Debe completar una ciudad válida en su perfil antes de publicar una donación.";
const INVALID_CITY_FOR_LIST_MESSAGE =
  "Debe completar una ciudad válida en su perfil antes de consultar donaciones disponibles.";
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

export interface OwnDonationListItem {
  id: number;
  titulo: string;
  ciudad: string;
  estado: EstadoDonacion;
  createdAt: Date;
  updatedAt: Date;
  categoria: {
    id: number;
    nombre: string;
  };
  imagenPrincipal: {
    id: number;
    referencia: string;
    orden: number;
  } | null;
  cantidadImagenes: number;
}

export interface OwnDonationsResult {
  donaciones: OwnDonationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type AvailableDonationsResult = OwnDonationsResult;

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

export async function listOwnDonations(
  userId: number,
  query: ListOwnDonationsQuery,
): Promise<OwnDonationsResult> {
  const { page, limit, estado } = query;
  const where = {
    propietarioId: userId,
    ...(estado === undefined ? {} : { estado }),
  };

  const [donations, total] = await prisma.$transaction([
    prisma.donacion.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        titulo: true,
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
          take: 1,
        },
        _count: {
          select: {
            imagenes: true,
          },
        },
      },
    }),
    prisma.donacion.count({ where }),
  ]);

  return {
    donaciones: donations.map((donation) => ({
      id: donation.id,
      titulo: donation.titulo,
      ciudad: donation.ciudad,
      estado: donation.estado,
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt,
      categoria: donation.categoria,
      imagenPrincipal: donation.imagenes[0] ?? null,
      cantidadImagenes: donation._count.imagenes,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function listAvailableDonations(
  userId: number,
  query: ListAvailableDonationsQuery,
): Promise<AvailableDonationsResult> {
  const { page, limit, categoriaId } = query;

  return prisma.$transaction(async (transaction) => {
    const user = await transaction.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        ciudad: true,
      },
    });

    if (user === null) {
      throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
    }

    const city = user.ciudad?.trim();

    if (city === undefined || city.length === 0) {
      throw new ApiError(409, INVALID_CITY_FOR_LIST_MESSAGE);
    }

    const where = {
      estado: EstadoDonacion.PUBLICADA,
      ciudad: city,
      propietarioId: {
        not: user.id,
      },
      ...(categoriaId === undefined ? {} : { categoriaId }),
    };

    const [donations, total] = await Promise.all([
      transaction.donacion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          titulo: true,
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
            take: 1,
          },
          _count: {
            select: {
              imagenes: true,
            },
          },
        },
      }),
      transaction.donacion.count({ where }),
    ]);

    return {
      donaciones: donations.map((donation) => ({
        id: donation.id,
        titulo: donation.titulo,
        ciudad: donation.ciudad,
        estado: donation.estado,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
        categoria: donation.categoria,
        imagenPrincipal: donation.imagenes[0] ?? null,
        cantidadImagenes: donation._count.imagenes,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}
