import {
  EstadoDonacion,
  EstadoSolicitud,
  Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/database/client";
import {
  findPendingRatingsPage,
  findRatingByDonation,
  findReceivedRatingsPage,
  ratingContextSelect,
} from "@/database/calificaciones";
import { ApiError } from "@/src/lib/api/errors";
import type {
  CreateRatingInput,
  RatingsPagination,
} from "@/src/lib/validations/calificaciones";

const RATING_NOT_FOUND_MESSAGE = "Calificación no encontrada.";
const USER_NOT_FOUND_MESSAGE = "Usuario no encontrado.";
const DONATION_NOT_DELIVERED_MESSAGE =
  "La donación no se encuentra disponible para calificar.";
const DUPLICATE_RATING_MESSAGE = "La donación ya tiene una calificación.";
const SELF_RATING_MESSAGE = "No puede calificarse a sí mismo.";
const CONCURRENT_RATING_MESSAGE =
  "La calificación cambió mientras se procesaba la operación.";
const MAX_TRANSACTION_ATTEMPTS = 3;

type RatingContext = Prisma.CalificacionGetPayload<{
  select: typeof ratingContextSelect;
}>;

interface PublicUser {
  id: number;
  nombreVisible: string;
  fotoPerfil: string | null;
}

interface RatingDonation {
  id: number;
  titulo: string;
  imagenPrincipal: string | null;
  entregadaAt: Date | null;
}

export interface SafeRating {
  id: number;
  puntuacion: number;
  createdAt: Date;
  donacion: RatingDonation;
  autor: PublicUser;
  calificado: PublicUser;
}

interface SafeReceivedRating {
  id: number;
  puntuacion: number;
  createdAt: Date;
  donacion: Omit<RatingDonation, "entregadaAt">;
  autor: PublicUser;
}

type PendingDonation = RatingDonation;

interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RatingResult {
  calificacion: SafeRating;
}

export interface ReceivedRatingsResult {
  resumen: {
    calificacionPromedio: number | null;
    totalCalificaciones: number;
  };
  calificaciones: SafeReceivedRating[];
  pagination: PaginationResult;
}

export interface PendingRatingsResult {
  tienePendientes: boolean;
  totalPendientes: number;
  donaciones: PendingDonation[];
  pagination: PaginationResult;
}

function pagination(query: RatingsPagination, total: number): PaginationResult {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  };
}

function hasConsistentAcceptedRequest(rating: RatingContext): boolean {
  const request = rating.donacion.solicitudAceptada;
  return (
    request !== null &&
    request.id === rating.donacion.solicitudAceptadaId &&
    request.donacionId === rating.donacion.id &&
    request.estado === EstadoSolicitud.ACEPTADA
  );
}

function mapRating(rating: RatingContext): SafeRating {
  const request = rating.donacion.solicitudAceptada;
  if (request === null || !hasConsistentAcceptedRequest(rating)) {
    throw new ApiError(404, RATING_NOT_FOUND_MESSAGE);
  }

  return {
    id: rating.id,
    puntuacion: rating.puntuacion,
    createdAt: rating.createdAt,
    donacion: {
      id: rating.donacion.id,
      titulo: rating.donacion.titulo,
      imagenPrincipal: rating.donacion.imagenes[0]?.referencia ?? null,
      entregadaAt: rating.donacion.entregadaAt,
    },
    autor: request.solicitante,
    calificado: rating.donacion.propietario,
  };
}

function isRetryableTransactionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function createRating(
  userId: number,
  donationId: number,
  input: CreateRatingInput,
): Promise<RatingResult> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          await transaction.$queryRaw(
            Prisma.sql`SELECT "id" FROM "Donacion" WHERE "id" = ${donationId} FOR UPDATE`,
          );

          const donation = await transaction.donacion.findUnique({
            where: { id: donationId },
            select: {
              id: true,
              estado: true,
              propietarioId: true,
              solicitudAceptadaId: true,
              calificacion: { select: { id: true } },
              solicitudAceptada: {
                select: {
                  id: true,
                  estado: true,
                  donacionId: true,
                  solicitanteId: true,
                },
              },
            },
          });
          if (donation === null) {
            throw new ApiError(404, RATING_NOT_FOUND_MESSAGE);
          }

          if (donation.propietarioId === userId) {
            throw new ApiError(409, SELF_RATING_MESSAGE);
          }

          const request = donation.solicitudAceptada;
          if (
            request === null ||
            request.solicitanteId !== userId ||
            request.id !== donation.solicitudAceptadaId ||
            request.donacionId !== donation.id ||
            request.estado !== EstadoSolicitud.ACEPTADA
          ) {
            throw new ApiError(404, RATING_NOT_FOUND_MESSAGE);
          }

          if (donation.estado !== EstadoDonacion.ENTREGADA) {
            throw new ApiError(409, DONATION_NOT_DELIVERED_MESSAGE);
          }

          if (donation.calificacion !== null) {
            throw new ApiError(409, DUPLICATE_RATING_MESSAGE);
          }

          const created = await transaction.calificacion.create({
            data: { donacionId: donation.id, puntuacion: input.puntuacion },
            select: { id: true },
          });
          const rating = await transaction.calificacion.findUniqueOrThrow({
            where: { id: created.id },
            select: ratingContextSelect,
          });

          return { calificacion: mapRating(rating) };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiError(409, DUPLICATE_RATING_MESSAGE);
      }

      if (isRetryableTransactionError(error) && attempt < MAX_TRANSACTION_ATTEMPTS) {
        continue;
      }

      if (isRetryableTransactionError(error)) {
        throw new ApiError(409, CONCURRENT_RATING_MESSAGE);
      }

      throw error;
    }
  }

  throw new ApiError(409, CONCURRENT_RATING_MESSAGE);
}

export async function getDonationRating(
  userId: number,
  donationId: number,
): Promise<RatingResult> {
  const rating = await findRatingByDonation(donationId);

  if (
    rating === null ||
    !hasConsistentAcceptedRequest(rating) ||
    (rating.donacion.propietarioId !== userId &&
      rating.donacion.solicitudAceptada?.solicitanteId !== userId)
  ) {
    throw new ApiError(404, RATING_NOT_FOUND_MESSAGE);
  }

  return { calificacion: mapRating(rating) };
}

export async function listReceivedRatings(
  userId: number,
  query: RatingsPagination,
): Promise<ReceivedRatingsResult> {
  const [user, ratings, total, aggregate] = await findReceivedRatingsPage({
    userId,
    ...query,
  });

  if (user === null) {
    throw new ApiError(404, USER_NOT_FOUND_MESSAGE);
  }

  const average = aggregate._avg.puntuacion;
  return {
    resumen: {
      calificacionPromedio:
        average === null ? null : Math.round(average * 10) / 10,
      totalCalificaciones: aggregate._count.id,
    },
    calificaciones: ratings.map((rating) => ({
      id: rating.id,
      puntuacion: rating.puntuacion,
      createdAt: rating.createdAt,
      donacion: {
        id: rating.donacion.id,
        titulo: rating.donacion.titulo,
        imagenPrincipal: rating.donacion.imagenes[0]?.referencia ?? null,
      },
      autor: rating.donacion.solicitudAceptada!.solicitante,
    })),
    pagination: pagination(query, total),
  };
}

export async function listPendingRatings(
  userId: number,
  query: RatingsPagination,
): Promise<PendingRatingsResult> {
  const [donations, total] = await findPendingRatingsPage({ userId, ...query });

  return {
    tienePendientes: total > 0,
    totalPendientes: total,
    donaciones: donations.map((donation) => ({
      id: donation.id,
      titulo: donation.titulo,
      imagenPrincipal: donation.imagenes[0]?.referencia ?? null,
      entregadaAt: donation.entregadaAt,
    })),
    pagination: pagination(query, total),
  };
}
