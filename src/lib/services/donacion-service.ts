import { EstadoDonacion, EstadoSolicitud } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import { ApiError } from "@/src/lib/api/errors";
import type {
  CreateDonationInput,
  DonationDetailQuery,
  ListAvailableDonationsQuery,
  ListOwnDonationsQuery,
  UpdateDonationInput,
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

export interface DonationDetailResult {
  donacion: CreatedDonation;
}

const DONATION_NOT_FOUND_MESSAGE = "Donación no encontrada.";
const DONATION_NOT_UPDATABLE_MESSAGE =
  "La donación no puede actualizarse en su estado actual.";

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

export async function getDonationDetail(
  userId: number,
  query: DonationDetailQuery,
): Promise<DonationDetailResult> {
  const [user, donation] = await prisma.$transaction([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, ciudad: true },
    }),
    prisma.donacion.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        ciudad: true,
        estado: true,
        propietarioId: true,
        createdAt: true,
        updatedAt: true,
        categoria: {
          select: { id: true, nombre: true },
        },
        imagenes: {
          select: { id: true, referencia: true, orden: true },
          orderBy: { orden: "asc" },
        },
        solicitudAceptada: {
          select: {
            donacionId: true,
            solicitanteId: true,
            estado: true,
          },
        },
      },
    }),
  ]);

  if (user === null) {
    throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
  }

  if (donation === null) {
    throw new ApiError(404, "Donación no encontrada.");
  }

  const userCity = user.ciudad;
  const acceptedRequest = donation.solicitudAceptada;
  const isOwner = donation.propietarioId === user.id;
  const isPublishedInSameCity =
    donation.estado === EstadoDonacion.PUBLICADA &&
    userCity !== undefined &&
    userCity.trim().length > 0 &&
    donation.ciudad === userCity;
  const isSelectedRecipient =
    (donation.estado === EstadoDonacion.RESERVADA ||
      donation.estado === EstadoDonacion.ENTREGADA) &&
    acceptedRequest !== null &&
    acceptedRequest.donacionId === donation.id &&
    acceptedRequest.estado === EstadoSolicitud.ACEPTADA &&
    acceptedRequest.solicitanteId === user.id;

  if (!isOwner && !isPublishedInSameCity && !isSelectedRecipient) {
    throw new ApiError(404, "Donación no encontrada.");
  }

  return {
    donacion: {
      id: donation.id,
      titulo: donation.titulo,
      descripcion: donation.descripcion,
      ciudad: donation.ciudad,
      estado: donation.estado,
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt,
      categoria: donation.categoria,
      imagenes: donation.imagenes,
    },
  };
}

export async function updateDonation(
  userId: number,
  donationId: number,
  input: UpdateDonationInput,
): Promise<DonationDetailResult> {
  return prisma.$transaction(async (transaction) => {
    const donation = await transaction.donacion.findUnique({
      where: { id: donationId },
      select: { id: true, propietarioId: true, estado: true },
    });

    if (donation === null || donation.propietarioId !== userId) {
      throw new ApiError(404, DONATION_NOT_FOUND_MESSAGE);
    }

    if (donation.estado !== EstadoDonacion.PUBLICADA) {
      throw new ApiError(409, DONATION_NOT_UPDATABLE_MESSAGE);
    }

    if (input.categoriaId !== undefined) {
      const category = await transaction.categoria.findUnique({
        where: { id: input.categoriaId },
        select: { id: true, activo: true },
      });

      if (category === null) {
        throw new ApiError(404, CATEGORY_NOT_FOUND_MESSAGE);
      }

      if (!category.activo) {
        throw new ApiError(409, INACTIVE_CATEGORY_MESSAGE);
      }
    }

    const updateResult = await transaction.donacion.updateMany({
      where: {
        id: donation.id,
        propietarioId: userId,
        estado: EstadoDonacion.PUBLICADA,
      },
      data: {
        ...(input.titulo === undefined ? {} : { titulo: input.titulo }),
        ...(input.descripcion === undefined
          ? {}
          : { descripcion: input.descripcion }),
        ...(input.categoriaId === undefined
          ? {}
          : { categoriaId: input.categoriaId }),
      },
    });

    if (updateResult.count !== 1) {
      const currentDonation = await transaction.donacion.findUnique({
        where: { id: donation.id },
        select: { propietarioId: true, estado: true },
      });

      if (currentDonation === null || currentDonation.propietarioId !== userId) {
        throw new ApiError(404, DONATION_NOT_FOUND_MESSAGE);
      }

      throw new ApiError(409, DONATION_NOT_UPDATABLE_MESSAGE);
    }

    if (input.imagenes !== undefined) {
      await transaction.imagenDonacion.deleteMany({
        where: { donacionId: donation.id },
      });

      await transaction.imagenDonacion.createMany({
        data: input.imagenes.map((referencia, index) => ({
          donacionId: donation.id,
          referencia,
          orden: index + 1,
        })),
      });
    }

    const updatedDonation = await transaction.donacion.findUnique({
      where: { id: donation.id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        ciudad: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        categoria: { select: { id: true, nombre: true } },
        imagenes: {
          select: { id: true, referencia: true, orden: true },
          orderBy: { orden: "asc" },
        },
      },
    });

    if (updatedDonation === null) {
      throw new ApiError(404, DONATION_NOT_FOUND_MESSAGE);
    }

    return { donacion: updatedDonation };
  });
}
