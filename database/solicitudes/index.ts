import { EstadoSolicitud } from "@/generated/prisma/client";

import { prisma } from "@/database/client";

export const requestDonationSelect = {
  id: true,
  titulo: true,
  estado: true,
  imagenes: {
    orderBy: { orden: "asc" as const },
    take: 1,
    select: { referencia: true },
  },
} as const;

export const publicUserSelect = {
  id: true,
  nombreVisible: true,
  fotoPerfil: true,
  ciudad: true,
} as const;

export const requestBaseSelect = {
  id: true,
  estado: true,
  causaCancelacion: true,
  aceptadaAt: true,
  rechazadaAt: true,
  canceladaAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface RequestPageInput {
  userId: number;
  page: number;
  limit: number;
  estado?: EstadoSolicitud;
}

export function findSentRequestsPage(input: RequestPageInput) {
  const where = {
    solicitanteId: input.userId,
    ...(input.estado === undefined ? {} : { estado: input.estado }),
  };

  return prisma.$transaction([
    prisma.solicitud.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        ...requestBaseSelect,
        donacion: {
          select: {
            ...requestDonationSelect,
            propietario: { select: publicUserSelect },
          },
        },
      },
    }),
    prisma.solicitud.count({ where }),
  ]);
}

export function findReceivedRequestsPage(input: RequestPageInput) {
  const where = {
    donacion: { propietarioId: input.userId },
    ...(input.estado === undefined ? {} : { estado: input.estado }),
  };

  return prisma.$transaction([
    prisma.solicitud.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        ...requestBaseSelect,
        donacion: { select: requestDonationSelect },
        solicitante: { select: publicUserSelect },
      },
    }),
    prisma.solicitud.count({ where }),
  ]);
}

export function findDonationRequestsPage(
  input: Omit<RequestPageInput, "userId"> & { donationId: number },
) {
  const where = {
    donacionId: input.donationId,
    ...(input.estado === undefined ? {} : { estado: input.estado }),
  };

  return prisma.$transaction([
    prisma.solicitud.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        ...requestBaseSelect,
        donacion: { select: requestDonationSelect },
        solicitante: { select: publicUserSelect },
      },
    }),
    prisma.solicitud.count({ where }),
  ]);
}

export function findRequestDetail(requestId: number) {
  return prisma.solicitud.findUnique({
    where: { id: requestId },
    select: {
      ...requestBaseSelect,
      solicitanteId: true,
      donacion: {
        select: {
          ...requestDonationSelect,
          propietarioId: true,
          propietario: { select: publicUserSelect },
        },
      },
      solicitante: { select: publicUserSelect },
    },
  });
}
