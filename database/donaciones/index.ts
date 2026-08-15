import { EstadoDonacion } from "@/generated/prisma/client";

import { prisma } from "@/database/client";

const donationListSelect = {
  id: true,
  titulo: true,
  ciudad: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
  categoria: { select: { id: true, nombre: true } },
  imagenes: {
    select: { id: true, referencia: true, orden: true },
    orderBy: { orden: "asc" as const },
    take: 1,
  },
  _count: { select: { imagenes: true } },
} as const;

export function findOwnDonationsPage(input: {
  userId: number;
  page: number;
  limit: number;
  estado?: EstadoDonacion;
}) {
  const where = {
    propietarioId: input.userId,
    ...(input.estado === undefined ? {} : { estado: input.estado }),
  };

  return prisma.$transaction([
    prisma.donacion.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
      select: donationListSelect,
    }),
    prisma.donacion.count({ where }),
  ]);
}

export function findAvailableDonationsPage(input: {
  userId: number;
  city: string;
  page: number;
  limit: number;
  categoriaId?: number;
}) {
  const where = {
    estado: EstadoDonacion.PUBLICADA,
    ciudad: input.city,
    propietarioId: { not: input.userId },
    ...(input.categoriaId === undefined ? {} : { categoriaId: input.categoriaId }),
  };

  return prisma.$transaction([
    prisma.donacion.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
      select: donationListSelect,
    }),
    prisma.donacion.count({ where }),
  ]);
}

export function findDonationDetailContext(userId: number, donationId: number) {
  return prisma.$transaction([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, ciudad: true },
    }),
    prisma.donacion.findUnique({
      where: { id: donationId },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        ciudad: true,
        estado: true,
        propietarioId: true,
        createdAt: true,
        updatedAt: true,
        categoria: { select: { id: true, nombre: true } },
        imagenes: {
          select: { id: true, referencia: true, orden: true },
          orderBy: { orden: "asc" },
        },
        solicitudAceptada: {
          select: { donacionId: true, solicitanteId: true, estado: true },
        },
      },
    }),
  ]);
}
