import {
  CausaCancelacionSolicitud,
  EstadoDonacion,
  EstadoSolicitud,
  Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/database/client";
import {
  findDonationRequestsPage,
  findReceivedRequestsPage,
  findRequestDetail,
  findSentRequestsPage,
  publicUserSelect,
  requestBaseSelect,
  requestDonationSelect,
} from "@/database/solicitudes";
import { ApiError } from "@/src/lib/api/errors";
import type {
  CreateRequestInput,
  ListRequestsQuery,
} from "@/src/lib/validations/solicitudes";

const DONATION_NOT_FOUND_MESSAGE = "Donación no encontrada.";
const REQUEST_NOT_FOUND_MESSAGE = "Solicitud no encontrada.";
const OWN_DONATION_MESSAGE = "No puede solicitar una donación propia.";
const DUPLICATE_REQUEST_MESSAGE =
  "Ya existe una solicitud activa para esta donación.";
const PENDING_RATINGS_MESSAGE =
  "Debes completar tus calificaciones pendientes antes de solicitar otra donación.";
const INVALID_TRANSITION_MESSAGE =
  "La solicitud no puede cambiar al estado solicitado.";
const CONCURRENT_CONFLICT_MESSAGE =
  "La solicitud cambió mientras se procesaba la operación.";

type PublicUser = {
  id: number;
  nombreVisible: string;
  fotoPerfil: string | null;
  ciudad: string;
};

type RequestDonation = {
  id: number;
  titulo: string;
  estado: EstadoDonacion;
  imagenPrincipal: string | null;
};

export interface SafeRequest {
  id: number;
  estado: EstadoSolicitud;
  causaCancelacion: CausaCancelacionSolicitud | null;
  aceptadaAt: Date | null;
  rechazadaAt: Date | null;
  canceladaAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  donacion: RequestDonation;
  donante?: PublicUser;
  solicitante?: PublicUser;
}

export interface RequestResult {
  solicitud: SafeRequest;
}

export interface RequestsPageResult {
  solicitudes: SafeRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mapDonation(donation: {
  id: number;
  titulo: string;
  estado: EstadoDonacion;
  imagenes: Array<{ referencia: string }>;
}): RequestDonation {
  return {
    id: donation.id,
    titulo: donation.titulo,
    estado: donation.estado,
    imagenPrincipal: donation.imagenes[0]?.referencia ?? null,
  };
}

function mapRequest(
  request: {
    id: number;
    estado: EstadoSolicitud;
    causaCancelacion: CausaCancelacionSolicitud | null;
    aceptadaAt: Date | null;
    rechazadaAt: Date | null;
    canceladaAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    donacion: Parameters<typeof mapDonation>[0];
    solicitante?: PublicUser;
  },
  donante?: PublicUser,
): SafeRequest {
  return {
    id: request.id,
    estado: request.estado,
    causaCancelacion: request.causaCancelacion,
    aceptadaAt: request.aceptadaAt,
    rechazadaAt: request.rechazadaAt,
    canceladaAt: request.canceladaAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    donacion: mapDonation(request.donacion),
    ...(donante === undefined ? {} : { donante }),
    ...(request.solicitante === undefined
      ? {}
      : { solicitante: request.solicitante }),
  };
}

function pagination(query: ListRequestsQuery, total: number) {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  };
}

function translateConcurrentError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2034")
  ) {
    throw new ApiError(409, CONCURRENT_CONFLICT_MESSAGE);
  }

  throw error;
}

export async function createRequest(
  userId: number,
  userCity: string,
  input: CreateRequestInput,
): Promise<RequestResult> {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const donation = await transaction.donacion.findUnique({
          where: { id: input.donacionId },
          select: {
            id: true,
            titulo: true,
            ciudad: true,
            estado: true,
            propietarioId: true,
            imagenes: {
              orderBy: { orden: "asc" },
              take: 1,
              select: { referencia: true },
            },
          },
        });

        if (
          donation === null ||
          donation.estado !== EstadoDonacion.PUBLICADA ||
          donation.ciudad !== userCity.trim()
        ) {
          throw new ApiError(404, DONATION_NOT_FOUND_MESSAGE);
        }

        if (donation.propietarioId === userId) {
          throw new ApiError(409, OWN_DONATION_MESSAGE);
        }

        const pendingRating = await transaction.donacion.findFirst({
          where: {
            estado: EstadoDonacion.ENTREGADA,
            solicitudAceptada: {
              estado: EstadoSolicitud.ACEPTADA,
              solicitanteId: userId,
            },
            calificacion: null,
            exencionCalificacion: null,
          },
          select: { id: true },
        });

        if (pendingRating !== null) {
          throw new ApiError(409, PENDING_RATINGS_MESSAGE);
        }

        const duplicate = await transaction.solicitud.findFirst({
          where: {
            donacionId: donation.id,
            solicitanteId: userId,
            estado: { in: [EstadoSolicitud.PENDIENTE, EstadoSolicitud.ACEPTADA] },
          },
          select: { id: true },
        });

        if (duplicate !== null) {
          throw new ApiError(409, DUPLICATE_REQUEST_MESSAGE);
        }

        const created = await transaction.solicitud.create({
          data: {
            donacionId: donation.id,
            solicitanteId: userId,
            estado: EstadoSolicitud.PENDIENTE,
          },
          select: requestBaseSelect,
        });

        return {
          solicitud: {
            ...created,
            donacion: mapDonation(donation),
          },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(409, DUPLICATE_REQUEST_MESSAGE);
    }

    translateConcurrentError(error);
  }
}

export async function listSentRequests(
  userId: number,
  query: ListRequestsQuery,
): Promise<RequestsPageResult> {
  const [requests, total] = await findSentRequestsPage({ userId, ...query });

  return {
    solicitudes: requests.map((request) =>
      mapRequest(request, request.donacion.propietario),
    ),
    pagination: pagination(query, total),
  };
}

export async function listReceivedRequests(
  userId: number,
  query: ListRequestsQuery,
): Promise<RequestsPageResult> {
  const [requests, total] = await findReceivedRequestsPage({ userId, ...query });

  return {
    solicitudes: requests.map((request) => mapRequest(request)),
    pagination: pagination(query, total),
  };
}

export async function listDonationRequests(
  userId: number,
  donationId: number,
  query: ListRequestsQuery,
): Promise<RequestsPageResult> {
  const donation = await prisma.donacion.findUnique({
    where: { id: donationId },
    select: { propietarioId: true },
  });

  if (donation === null || donation.propietarioId !== userId) {
    throw new ApiError(404, DONATION_NOT_FOUND_MESSAGE);
  }

  const [requests, total] = await findDonationRequestsPage({
    donationId,
    ...query,
  });

  return {
    solicitudes: requests.map((request) => mapRequest(request)),
    pagination: pagination(query, total),
  };
}

export async function getRequestDetail(
  userId: number,
  requestId: number,
): Promise<RequestResult> {
  const request = await findRequestDetail(requestId);

  if (
    request === null ||
    (request.solicitanteId !== userId &&
      request.donacion.propietarioId !== userId)
  ) {
    throw new ApiError(404, REQUEST_NOT_FOUND_MESSAGE);
  }

  const isApplicant = request.solicitanteId === userId;

  return {
    solicitud: mapRequest(
      request,
      isApplicant ? request.donacion.propietario : undefined,
    ),
  };
}

const mutationDetailSelect = {
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
} as const;

async function requestResultForActor(
  transaction: Prisma.TransactionClient,
  requestId: number,
  actor: "OWNER" | "APPLICANT",
): Promise<RequestResult> {
  const request = await transaction.solicitud.findUnique({
    where: { id: requestId },
    select: mutationDetailSelect,
  });

  if (request === null) {
    throw new ApiError(404, REQUEST_NOT_FOUND_MESSAGE);
  }

  return {
    solicitud: mapRequest(
      request,
      actor === "APPLICANT" ? request.donacion.propietario : undefined,
    ),
  };
}

export async function acceptRequest(
  userId: number,
  requestId: number,
): Promise<RequestResult> {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const request = await transaction.solicitud.findUnique({
          where: { id: requestId },
          select: {
            id: true,
            estado: true,
            donacionId: true,
            donacion: {
              select: {
                propietarioId: true,
                estado: true,
                solicitudAceptadaId: true,
              },
            },
          },
        });

        if (request === null || request.donacion.propietarioId !== userId) {
          throw new ApiError(404, REQUEST_NOT_FOUND_MESSAGE);
        }

        if (
          request.estado === EstadoSolicitud.ACEPTADA &&
          request.donacion.estado === EstadoDonacion.RESERVADA &&
          request.donacion.solicitudAceptadaId === request.id
        ) {
          return requestResultForActor(transaction, request.id, "OWNER");
        }

        if (
          request.estado !== EstadoSolicitud.PENDIENTE ||
          request.donacion.estado !== EstadoDonacion.PUBLICADA
        ) {
          throw new ApiError(409, INVALID_TRANSITION_MESSAGE);
        }

        const now = new Date();
        const reserved = await transaction.donacion.updateMany({
          where: {
            id: request.donacionId,
            propietarioId: userId,
            estado: EstadoDonacion.PUBLICADA,
            solicitudAceptadaId: null,
          },
          data: {
            estado: EstadoDonacion.RESERVADA,
            solicitudAceptadaId: request.id,
          },
        });

        if (reserved.count !== 1) {
          throw new ApiError(409, CONCURRENT_CONFLICT_MESSAGE);
        }

        const accepted = await transaction.solicitud.updateMany({
          where: { id: request.id, estado: EstadoSolicitud.PENDIENTE },
          data: {
            estado: EstadoSolicitud.ACEPTADA,
            aceptadaAt: now,
            rechazadaAt: null,
            canceladaAt: null,
            causaCancelacion: null,
          },
        });

        if (accepted.count !== 1) {
          throw new ApiError(409, CONCURRENT_CONFLICT_MESSAGE);
        }

        await transaction.solicitud.updateMany({
          where: {
            donacionId: request.donacionId,
            id: { not: request.id },
            estado: EstadoSolicitud.PENDIENTE,
          },
          data: {
            estado: EstadoSolicitud.CANCELADA,
            causaCancelacion:
              CausaCancelacionSolicitud.OTRA_SOLICITUD_ACEPTADA,
            canceladaAt: now,
          },
        });

        return requestResultForActor(transaction, request.id, "OWNER");
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      const current = await prisma.solicitud.findUnique({
        where: { id: requestId },
        select: {
          estado: true,
          donacion: {
            select: {
              propietarioId: true,
              estado: true,
              solicitudAceptadaId: true,
            },
          },
        },
      });

      if (
        current !== null &&
        current.estado === EstadoSolicitud.ACEPTADA &&
        current.donacion.propietarioId === userId &&
        current.donacion.estado === EstadoDonacion.RESERVADA &&
        current.donacion.solicitudAceptadaId === requestId
      ) {
        return getRequestDetail(userId, requestId);
      }
    }

    translateConcurrentError(error);
  }
}

export async function rejectRequest(
  userId: number,
  requestId: number,
): Promise<RequestResult> {
  return prisma.$transaction(async (transaction) => {
    const request = await transaction.solicitud.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        estado: true,
        donacion: { select: { propietarioId: true } },
      },
    });

    if (request === null || request.donacion.propietarioId !== userId) {
      throw new ApiError(404, REQUEST_NOT_FOUND_MESSAGE);
    }

    if (request.estado === EstadoSolicitud.RECHAZADA) {
      return requestResultForActor(transaction, request.id, "OWNER");
    }

    if (request.estado !== EstadoSolicitud.PENDIENTE) {
      throw new ApiError(409, INVALID_TRANSITION_MESSAGE);
    }

    const result = await transaction.solicitud.updateMany({
      where: { id: request.id, estado: EstadoSolicitud.PENDIENTE },
      data: { estado: EstadoSolicitud.RECHAZADA, rechazadaAt: new Date() },
    });

    if (result.count !== 1) {
      const current = await transaction.solicitud.findUnique({
        where: { id: request.id },
        select: { estado: true },
      });

      if (current?.estado === EstadoSolicitud.RECHAZADA) {
        return requestResultForActor(transaction, request.id, "OWNER");
      }

      throw new ApiError(409, CONCURRENT_CONFLICT_MESSAGE);
    }

    return requestResultForActor(transaction, request.id, "OWNER");
  });
}

export async function cancelRequest(
  userId: number,
  requestId: number,
): Promise<RequestResult> {
  return prisma.$transaction(async (transaction) => {
    const request = await transaction.solicitud.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        estado: true,
        causaCancelacion: true,
        solicitanteId: true,
      },
    });

    if (request === null || request.solicitanteId !== userId) {
      throw new ApiError(404, REQUEST_NOT_FOUND_MESSAGE);
    }

    if (
      request.estado === EstadoSolicitud.CANCELADA &&
      request.causaCancelacion === CausaCancelacionSolicitud.VOLUNTARIA
    ) {
      return requestResultForActor(transaction, request.id, "APPLICANT");
    }

    if (request.estado !== EstadoSolicitud.PENDIENTE) {
      throw new ApiError(409, INVALID_TRANSITION_MESSAGE);
    }

    const result = await transaction.solicitud.updateMany({
      where: {
        id: request.id,
        solicitanteId: userId,
        estado: EstadoSolicitud.PENDIENTE,
      },
      data: {
        estado: EstadoSolicitud.CANCELADA,
        causaCancelacion: CausaCancelacionSolicitud.VOLUNTARIA,
        canceladaAt: new Date(),
      },
    });

    if (result.count !== 1) {
      const current = await transaction.solicitud.findUnique({
        where: { id: request.id },
        select: { estado: true, causaCancelacion: true },
      });

      if (
        current?.estado === EstadoSolicitud.CANCELADA &&
        current.causaCancelacion === CausaCancelacionSolicitud.VOLUNTARIA
      ) {
        return requestResultForActor(transaction, request.id, "APPLICANT");
      }

      throw new ApiError(409, CONCURRENT_CONFLICT_MESSAGE);
    }

    return requestResultForActor(transaction, request.id, "APPLICANT");
  });
}
