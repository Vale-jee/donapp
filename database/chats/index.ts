import { EstadoSolicitud, Prisma } from "@/generated/prisma/client";

import { prisma } from "@/database/client";

export const chatPublicUserSelect = {
  id: true,
  nombreVisible: true,
  fotoPerfil: true,
  ciudad: true,
  activo: true,
} as const;

export const chatContextSelect = {
  id: true,
  solicitudId: true,
  ultimoMensajeAt: true,
  createdAt: true,
  solicitud: {
    select: {
      id: true,
      estado: true,
      solicitanteId: true,
      solicitante: { select: chatPublicUserSelect },
      donacion: {
        select: {
          id: true,
          titulo: true,
          estado: true,
          propietarioId: true,
          solicitudAceptadaId: true,
          propietario: { select: chatPublicUserSelect },
          imagenes: {
            orderBy: { orden: "asc" as const },
            take: 1,
            select: { referencia: true },
          },
        },
      },
    },
  },
} satisfies Prisma.ChatSelect;

export const messageSafeSelect = {
  id: true,
  contenido: true,
  createdAt: true,
  remitente: {
    select: {
      id: true,
      nombreVisible: true,
      fotoPerfil: true,
    },
  },
} satisfies Prisma.MensajeSelect;

export function findChatContext(chatId: number) {
  return prisma.chat.findUnique({
    where: { id: chatId },
    select: chatContextSelect,
  });
}

export function findUserChatsPage(input: {
  userId: number;
  page: number;
  limit: number;
}) {
  const where = {
    solicitud: {
      estado: EstadoSolicitud.ACEPTADA,
      seleccionadaEnDonacion: { isNot: null },
      OR: [
        { solicitanteId: input.userId },
        { donacion: { propietarioId: input.userId } },
      ],
    },
  } satisfies Prisma.ChatWhereInput;

  return prisma.$transaction([
    prisma.chat.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [
        { ultimoMensajeAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "desc" },
      ],
      select: chatContextSelect,
    }),
    prisma.chat.count({ where }),
  ]);
}

export function findMessagesPage(input: {
  chatId: number;
  page: number;
  limit: number;
}) {
  const where = { chatId: input.chatId };

  return prisma.$transaction([
    prisma.mensaje.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: messageSafeSelect,
    }),
    prisma.mensaje.count({ where }),
  ]);
}
