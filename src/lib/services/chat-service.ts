import {
  EstadoDonacion,
  EstadoSolicitud,
  Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/database/client";
import {
  chatContextSelect,
  findChatContext,
  findMessagesPage,
  findUserChatsPage,
  messageSafeSelect,
} from "@/database/chats";
import { ApiError } from "@/src/lib/api/errors";
import type {
  ChatPagination,
  SendMessageInput,
} from "@/src/lib/validations/chats";

const CHAT_NOT_FOUND_MESSAGE = "Chat no encontrado.";
const REQUEST_NOT_FOUND_MESSAGE = "Solicitud no encontrada.";
const CHAT_NOT_ENABLED_MESSAGE = "La solicitud no permite habilitar el chat.";
const READ_ONLY_CHAT_MESSAGE = "El chat se encuentra en modo solo lectura.";
const INACTIVE_PARTICIPANT_MESSAGE =
  "No se pueden enviar mensajes porque un participante está inactivo.";
const CONCURRENT_CHAT_MESSAGE =
  "El chat cambió mientras se procesaba la operación.";
const MAX_TRANSACTION_ATTEMPTS = 3;

type ChatContext = Prisma.ChatGetPayload<{ select: typeof chatContextSelect }>;
type SafeMessage = Prisma.MensajeGetPayload<{
  select: typeof messageSafeSelect;
}>;

interface SafeChat {
  id: number;
  solicitudId: number;
  createdAt: Date;
  ultimoMensajeAt: Date | null;
  donacion: {
    id: number;
    titulo: string;
    estado: EstadoDonacion;
    imagenPrincipal: string | null;
  };
  otroParticipante: {
    id: number;
    nombreVisible: string;
    fotoPerfil: string | null;
    ciudad: string;
  };
}

export interface ChatResult {
  chat: SafeChat;
}

export interface CreateChatResult extends ChatResult {
  created: boolean;
}

export interface ChatsPageResult {
  chats: SafeChat[];
  pagination: PaginationResult;
}

export interface MessagesPageResult {
  mensajes: SafeMessage[];
  pagination: PaginationResult;
}

export interface MessageResult {
  mensaje: SafeMessage;
}

interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function pagination(query: ChatPagination, total: number): PaginationResult {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  };
}

function isParticipant(chat: ChatContext, userId: number): boolean {
  return (
    chat.solicitud.donacion.propietarioId === userId ||
    chat.solicitud.solicitanteId === userId
  );
}

function hasConsistentAcceptedRequest(chat: ChatContext): boolean {
  return (
    chat.solicitud.estado === EstadoSolicitud.ACEPTADA &&
    chat.solicitud.donacion.solicitudAceptadaId === chat.solicitud.id
  );
}

function assertVisibleChat(
  chat: ChatContext | null,
  userId: number,
): asserts chat is ChatContext {
  if (
    chat === null ||
    !hasConsistentAcceptedRequest(chat) ||
    !isParticipant(chat, userId)
  ) {
    throw new ApiError(404, CHAT_NOT_FOUND_MESSAGE);
  }
}

function mapChat(chat: ChatContext, userId: number): SafeChat {
  const donation = chat.solicitud.donacion;
  const otherParticipant =
    donation.propietarioId === userId
      ? chat.solicitud.solicitante
      : donation.propietario;

  return {
    id: chat.id,
    solicitudId: chat.solicitudId,
    createdAt: chat.createdAt,
    ultimoMensajeAt: chat.ultimoMensajeAt,
    donacion: {
      id: donation.id,
      titulo: donation.titulo,
      estado: donation.estado,
      imagenPrincipal: donation.imagenes[0]?.referencia ?? null,
    },
    otroParticipante: {
      id: otherParticipant.id,
      nombreVisible: otherParticipant.nombreVisible,
      fotoPerfil: otherParticipant.fotoPerfil,
      ciudad: otherParticipant.ciudad,
    },
  };
}

function isRetryableTransactionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

async function findCreatedChat(
  userId: number,
  requestId: number,
): Promise<CreateChatResult> {
  const chat = await prisma.chat.findUnique({
    where: { solicitudId: requestId },
    select: chatContextSelect,
  });
  assertVisibleChat(chat, userId);

  return { chat: mapChat(chat, userId), created: false };
}

export async function getOrCreateChat(
  userId: number,
  requestId: number,
): Promise<CreateChatResult> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const request = await transaction.solicitud.findUnique({
            where: { id: requestId },
            select: {
              id: true,
              estado: true,
              solicitanteId: true,
              solicitante: { select: { activo: true } },
              donacion: {
                select: {
                  id: true,
                  estado: true,
                  propietarioId: true,
                  solicitudAceptadaId: true,
                  propietario: { select: { activo: true } },
                },
              },
              chat: { select: { id: true } },
            },
          });

          if (
            request === null ||
            (request.donacion.propietarioId !== userId &&
              request.solicitanteId !== userId)
          ) {
            throw new ApiError(404, REQUEST_NOT_FOUND_MESSAGE);
          }

          if (
            request.estado !== EstadoSolicitud.ACEPTADA ||
            request.donacion.solicitudAceptadaId !== request.id ||
            request.donacion.estado !== EstadoDonacion.RESERVADA ||
            !request.donacion.propietario.activo ||
            !request.solicitante.activo
          ) {
            throw new ApiError(409, CHAT_NOT_ENABLED_MESSAGE);
          }

          let created = false;
          let chatId = request.chat?.id;

          if (chatId === undefined) {
            const chat = await transaction.chat.create({
              data: { solicitudId: request.id },
              select: { id: true },
            });
            chatId = chat.id;
            created = true;
          }

          const context = await transaction.chat.findUnique({
            where: { id: chatId },
            select: chatContextSelect,
          });
          assertVisibleChat(context, userId);

          return { chat: mapChat(context, userId), created };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return findCreatedChat(userId, requestId);
      }

      if (isRetryableTransactionError(error) && attempt < MAX_TRANSACTION_ATTEMPTS) {
        continue;
      }

      if (isRetryableTransactionError(error)) {
        throw new ApiError(409, CONCURRENT_CHAT_MESSAGE);
      }

      throw error;
    }
  }

  throw new ApiError(409, CONCURRENT_CHAT_MESSAGE);
}

export async function listChats(
  userId: number,
  query: ChatPagination,
): Promise<ChatsPageResult> {
  const [chats, total] = await findUserChatsPage({ userId, ...query });

  return {
    chats: chats.map((chat) => mapChat(chat, userId)),
    pagination: pagination(query, total),
  };
}

export async function getChat(
  userId: number,
  chatId: number,
): Promise<ChatResult> {
  const chat = await findChatContext(chatId);
  assertVisibleChat(chat, userId);

  return { chat: mapChat(chat, userId) };
}

export async function listMessages(
  userId: number,
  chatId: number,
  query: ChatPagination,
): Promise<MessagesPageResult> {
  const chat = await findChatContext(chatId);
  assertVisibleChat(chat, userId);
  const [messages, total] = await findMessagesPage({ chatId, ...query });

  return {
    mensajes: messages,
    pagination: pagination(query, total),
  };
}

export async function sendMessage(
  userId: number,
  chatId: number,
  input: SendMessageInput,
): Promise<MessageResult> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const chatBeforeLock = await transaction.chat.findUnique({
            where: { id: chatId },
            select: { solicitud: { select: { donacionId: true } } },
          });

          if (chatBeforeLock === null) {
            throw new ApiError(404, CHAT_NOT_FOUND_MESSAGE);
          }

          await transaction.$queryRaw(
            Prisma.sql`SELECT "id" FROM "Donacion" WHERE "id" = ${chatBeforeLock.solicitud.donacionId} FOR UPDATE`,
          );

          const chat = await transaction.chat.findUnique({
            where: { id: chatId },
            select: chatContextSelect,
          });
          assertVisibleChat(chat, userId);

          if (chat.solicitud.donacion.estado !== EstadoDonacion.RESERVADA) {
            throw new ApiError(409, READ_ONLY_CHAT_MESSAGE);
          }

          if (
            !chat.solicitud.donacion.propietario.activo ||
            !chat.solicitud.solicitante.activo
          ) {
            throw new ApiError(409, INACTIVE_PARTICIPANT_MESSAGE);
          }

          const message = await transaction.mensaje.create({
            data: {
              chatId: chat.id,
              remitenteId: userId,
              contenido: input.contenido,
            },
            select: messageSafeSelect,
          });

          await transaction.chat.update({
            where: { id: chat.id },
            data: { ultimoMensajeAt: message.createdAt },
            select: { id: true },
          });

          return { mensaje: message };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      if (isRetryableTransactionError(error) && attempt < MAX_TRANSACTION_ATTEMPTS) {
        continue;
      }

      if (isRetryableTransactionError(error)) {
        throw new ApiError(409, CONCURRENT_CHAT_MESSAGE);
      }

      throw error;
    }
  }

  throw new ApiError(409, CONCURRENT_CHAT_MESSAGE);
}
