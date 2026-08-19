import { EstadoDonacion, EstadoSolicitud, Prisma } from "@/generated/prisma/client";

import { prisma } from "@/database/client";

export const ratingPublicUserSelect = {
  id: true,
  nombreVisible: true,
  fotoPerfil: true,
} as const;

export const ratingContextSelect = {
  id: true,
  puntuacion: true,
  createdAt: true,
  donacion: {
    select: {
      id: true,
      titulo: true,
      estado: true,
      entregadaAt: true,
      propietarioId: true,
      solicitudAceptadaId: true,
      imagenes: {
        orderBy: { orden: "asc" as const },
        take: 1,
        select: { referencia: true },
      },
      propietario: { select: ratingPublicUserSelect },
      solicitudAceptada: {
        select: {
          id: true,
          estado: true,
          donacionId: true,
          solicitanteId: true,
          solicitante: { select: ratingPublicUserSelect },
        },
      },
    },
  },
} satisfies Prisma.CalificacionSelect;

export const receivedRatingSelect = {
  id: true,
  puntuacion: true,
  createdAt: true,
  donacion: {
    select: {
      id: true,
      titulo: true,
      imagenes: {
        orderBy: { orden: "asc" as const },
        take: 1,
        select: { referencia: true },
      },
      solicitudAceptada: {
        select: {
          solicitante: { select: ratingPublicUserSelect },
        },
      },
    },
  },
} satisfies Prisma.CalificacionSelect;

export const pendingDonationSelect = {
  id: true,
  titulo: true,
  entregadaAt: true,
  imagenes: {
    orderBy: { orden: "asc" as const },
    take: 1,
    select: { referencia: true },
  },
} satisfies Prisma.DonacionSelect;

export function findRatingByDonation(donationId: number) {
  return prisma.calificacion.findUnique({
    where: { donacionId: donationId },
    select: ratingContextSelect,
  });
}

export function findReceivedRatingsPage(input: {
  userId: number;
  page: number;
  limit: number;
}) {
  const where = { donacion: { propietarioId: input.userId } };

  return prisma.$transaction([
    prisma.usuario.findFirst({
      where: { id: input.userId, activo: true },
      select: { id: true },
    }),
    prisma.calificacion.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: receivedRatingSelect,
    }),
    prisma.calificacion.count({ where }),
    prisma.calificacion.aggregate({
      where,
      _avg: { puntuacion: true },
      _count: { id: true },
    }),
  ]);
}

export function findPendingRatingsPage(input: {
  userId: number;
  page: number;
  limit: number;
}) {
  const where = {
    estado: EstadoDonacion.ENTREGADA,
    solicitudAceptada: {
      estado: EstadoSolicitud.ACEPTADA,
      solicitanteId: input.userId,
    },
    calificacion: null,
    exencionCalificacion: null,
  } satisfies Prisma.DonacionWhereInput;

  return prisma.$transaction([
    prisma.donacion.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [{ entregadaAt: "desc" }, { id: "desc" }],
      select: pendingDonationSelect,
    }),
    prisma.donacion.count({ where }),
  ]);
}
