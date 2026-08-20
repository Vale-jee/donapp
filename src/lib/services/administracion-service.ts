import {
  AccionAuditoriaAdministrativa,
  CausaCancelacionSolicitud,
  EstadoDonacion,
  EstadoSolicitud,
  Prisma,
  RolCodigo,
} from "@/generated/prisma/client";

import { prisma } from "@/database/client";
import {
  adminDonationSelect,
  adminPublicUserSelect,
  adminUserSummarySelect,
  findAdminAudit,
  findAdminChat,
  findAdminDonation,
  findAdminRating,
  findAdminRequest,
  listAdminAudits,
  listAdminChats,
  listAdminDonations,
  listAdminRatings,
  listAdminRequests,
  listAdminUsers,
  pendingRatingWhere,
} from "@/database/administracion";
import { ApiError } from "@/src/lib/api/errors";
import type {
  AdminAuditsQuery,
  AdminChatsQuery,
  AdminDonationsQuery,
  AdminRatingsQuery,
  AdminRequestsQuery,
  AdminUsersQuery,
} from "@/src/lib/validations/administracion";

const NOT_FOUND = "Recurso administrativo no encontrado.";
const SELF_STATE = "No puede modificar administrativamente su propia cuenta.";
const LAST_ADMIN = "Debe permanecer al menos un administrador activo.";
const INCOMPATIBLE = "El recurso no permite realizar esta operación administrativa.";
const CONCURRENT = "El recurso cambió mientras se procesaba la operación.";
const MAX_ATTEMPTS = 3;

function retryable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

async function withSerializableRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try { return await operation(); } catch (error: unknown) {
      if (retryable(error) && attempt < MAX_ATTEMPTS) continue;
      if (retryable(error)) throw new ApiError(409, CONCURRENT);
      throw error;
    }
  }
  throw new ApiError(409, CONCURRENT);
}

export const getAdminUsers = (query: AdminUsersQuery) => listAdminUsers(query);
export const getAdminDonations = (query: AdminDonationsQuery) => listAdminDonations(query);
export const getAdminRequests = (query: AdminRequestsQuery) => listAdminRequests(query);
export const getAdminChats = (query: AdminChatsQuery) => listAdminChats(query);
export const getAdminRatings = (query: AdminRatingsQuery) => listAdminRatings(query);
export const getAdminAudits = (query: AdminAuditsQuery) => listAdminAudits(query);

function found<T>(value: T | null): T {
  if (value === null) throw new ApiError(404, NOT_FOUND);
  return value;
}

export async function getAdminUserDetail(id: number) {
  const now = new Date();
  const [user, sessions, donations, requests, receivedRatings, pendingRatings] = await prisma.$transaction([
    prisma.usuario.findUnique({ where: { id }, select: { id: true, nombreCompleto: true, nombreVisible: true, email: true, telefono: true, fotoPerfil: true, ciudad: true, activo: true, createdAt: true, updatedAt: true, rol: { select: { codigo: true } } } }),
    prisma.sesion.findMany({ where: { usuarioId: id }, select: { revokedAt: true, expiresAt: true } }),
    prisma.donacion.groupBy({ by: ["estado"], where: { propietarioId: id }, orderBy: { estado: "asc" }, _count: { _all: true } }),
    prisma.solicitud.groupBy({ by: ["estado"], where: { solicitanteId: id }, orderBy: { estado: "asc" }, _count: { _all: true } }),
    prisma.calificacion.count({ where: { donacion: { propietarioId: id } } }),
    prisma.donacion.count({ where: pendingRatingWhere(id) }),
  ]);
  if (user === null) throw new ApiError(404, NOT_FOUND);
  const sessionSummary = sessions.reduce((summary, session) => {
    if (session.revokedAt !== null) summary.revocadas += 1;
    else if (session.expiresAt <= now) summary.expiradas += 1;
    else summary.activas += 1;
    return summary;
  }, { activas: 0, revocadas: 0, expiradas: 0 });
  return {
    usuario: { ...user, rol: user.rol.codigo }, sesiones: sessionSummary,
    donacionesPorEstado: Object.fromEntries(donations.map((item) => [item.estado, (item._count as { _all?: number })._all ?? 0])),
    solicitudesPorEstado: Object.fromEntries(requests.map((item) => [item.estado, (item._count as { _all?: number })._all ?? 0])),
    totalCalificacionesRecibidas: receivedRatings, totalCalificacionesPendientes: pendingRatings,
  };
}

async function adminUserSummary(transaction: Prisma.TransactionClient, id: number) {
  const user = await transaction.usuario.findUnique({ where: { id }, select: adminUserSummarySelect });
  if (user === null) throw new ApiError(404, NOT_FOUND);
  return { ...user, rol: user.rol.codigo };
}

export function changeAdminUserState(adminId: number, userId: number, activo: boolean, motivo: string) {
  if (adminId === userId) throw new ApiError(409, SELF_STATE);
  return withSerializableRetry(() => prisma.$transaction(async (transaction) => {
    const target = await transaction.usuario.findUnique({ where: { id: userId }, select: { id: true, activo: true, rol: { select: { codigo: true } } } });
    if (target === null) throw new ApiError(404, NOT_FOUND);
    if (target.activo === activo) return { usuario: await adminUserSummary(transaction, userId), efectos: { sesionesRevocadas: 0, donacionesRetiradas: 0, solicitudesCanceladas: 0 }, actualizado: false };
    if (!activo && target.rol.codigo === RolCodigo.ADMIN) {
      const activeAdmins = await transaction.usuario.count({ where: { activo: true, rol: { codigo: RolCodigo.ADMIN } } });
      if (activeAdmins <= 1) throw new ApiError(409, LAST_ADMIN);
    }
    const now = new Date();
    const updated = await transaction.usuario.updateMany({ where: { id: userId, activo: target.activo }, data: { activo } });
    if (updated.count !== 1) throw new ApiError(409, CONCURRENT);
    let sessionsRevoked = 0, donationsWithdrawn = 0, requestsCancelled = 0;
    if (!activo) {
      sessionsRevoked = (await transaction.sesion.updateMany({ where: { usuarioId: userId, revokedAt: null, expiresAt: { gt: now } }, data: { revokedAt: now } })).count;
      const published = await transaction.donacion.findMany({ where: { propietarioId: userId, estado: EstadoDonacion.PUBLICADA }, select: { id: true } });
      const donationIds = published.map((item) => item.id);
      donationsWithdrawn = (await transaction.donacion.updateMany({ where: { id: { in: donationIds }, estado: EstadoDonacion.PUBLICADA }, data: { estado: EstadoDonacion.RETIRADA, retiradaAt: now } })).count;
      requestsCancelled += (await transaction.solicitud.updateMany({ where: { solicitanteId: userId, estado: EstadoSolicitud.PENDIENTE }, data: { estado: EstadoSolicitud.CANCELADA, causaCancelacion: CausaCancelacionSolicitud.USUARIO_INACTIVO, canceladaAt: now } })).count;
      requestsCancelled += (await transaction.solicitud.updateMany({ where: { donacionId: { in: donationIds }, estado: EstadoSolicitud.PENDIENTE }, data: { estado: EstadoSolicitud.CANCELADA, causaCancelacion: CausaCancelacionSolicitud.DONACION_RETIRADA, canceladaAt: now } })).count;
    }
    await transaction.auditoriaAdministrativa.create({ data: { administradorId: adminId, accion: activo ? AccionAuditoriaAdministrativa.USUARIO_REACTIVADO : AccionAuditoriaAdministrativa.USUARIO_DESACTIVADO, entidad: "USUARIO", entidadId: String(userId), motivo, metadata: { estadoAnterior: target.activo, estadoNuevo: activo, sesionesRevocadas: sessionsRevoked, donacionesRetiradas: donationsWithdrawn, solicitudesCanceladas: requestsCancelled } } });
    return { usuario: await adminUserSummary(transaction, userId), efectos: { sesionesRevocadas: sessionsRevoked, donacionesRetiradas: donationsWithdrawn, solicitudesCanceladas: requestsCancelled }, actualizado: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

export function revokeAdminUserSessions(adminId: number, userId: number, motivo: string) {
  return withSerializableRetry(() => prisma.$transaction(async (transaction) => {
    const user = await transaction.usuario.findUnique({ where: { id: userId }, select: { id: true } });
    if (user === null) throw new ApiError(404, NOT_FOUND);
    const now = new Date();
    const count = (await transaction.sesion.updateMany({ where: { usuarioId: userId, revokedAt: null, expiresAt: { gt: now } }, data: { revokedAt: now } })).count;
    if (count > 0) await transaction.auditoriaAdministrativa.create({ data: { administradorId: adminId, accion: AccionAuditoriaAdministrativa.SESIONES_REVOCADAS, entidad: "USUARIO", entidadId: String(userId), motivo, metadata: { sesionesRevocadas: count } } });
    return { usuarioId: userId, sesionesRevocadas: count };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

export async function getAdminDonationDetail(id: number) {
  const donation = found(await findAdminDonation(id));
  const { solicitudes, ...detail } = donation;
  return {
    donacion: {
      ...detail,
      bloqueada:
        detail.estado === EstadoDonacion.RESERVADA &&
        detail.solicitudAceptada !== null &&
        (!detail.propietario.activo ||
          !detail.solicitudAceptada.solicitante.activo),
      calificacionPendiente:
        detail.estado === EstadoDonacion.ENTREGADA &&
        detail.solicitudAceptada?.estado === EstadoSolicitud.ACEPTADA &&
        detail.calificacion === null &&
        detail.exencionCalificacion === null,
    },
    solicitudesPorEstado: Object.fromEntries(
      Object.values(EstadoSolicitud).map((estado) => [
        estado,
        solicitudes.filter((request) => request.estado === estado).length,
      ]),
    ),
  };
}
export async function getAdminRequestDetail(id: number) { return { solicitud: found(await findAdminRequest(id)) }; }
export async function getAdminChatDetail(id: number) { return { chat: found(await findAdminChat(id)) }; }
export async function getAdminRatingDetail(id: number) { return { calificacion: found(await findAdminRating(id)) }; }
export async function getAdminAuditDetail(id: number) { return { auditoria: found(await findAdminAudit(id)) }; }

export function resolveAdminDonation(adminId: number, donationId: number, motivo: string) {
  return withSerializableRetry(() => prisma.$transaction(async (transaction) => {
    const donation = await transaction.donacion.findUnique({ where: { id: donationId }, select: { id: true, estado: true, solicitudAceptadaId: true, propietario: { select: { activo: true } }, solicitudAceptada: { select: { id: true, estado: true, donacionId: true, solicitante: { select: { activo: true } } } } } });
    if (donation === null) throw new ApiError(404, NOT_FOUND);
    const previousAudit = await transaction.auditoriaAdministrativa.findFirst({ where: { accion: AccionAuditoriaAdministrativa.DONACION_RESERVADA_RETIRADA, entidad: "DONACION", entidadId: String(donationId) }, select: { id: true } });
    if (donation.estado === EstadoDonacion.RETIRADA && previousAudit !== null) {
      const current = await transaction.donacion.findUniqueOrThrow({ where: { id: donationId }, select: adminDonationSelect });
      return { donacion: current, actualizado: false };
    }
    const request = donation.solicitudAceptada;
    if (donation.estado !== EstadoDonacion.RESERVADA || request === null || request.id !== donation.solicitudAceptadaId || request.donacionId !== donation.id || request.estado !== EstadoSolicitud.ACEPTADA || (donation.propietario.activo && request.solicitante.activo)) throw new ApiError(409, INCOMPATIBLE);
    const now = new Date();
    const result = await transaction.donacion.updateMany({ where: { id: donationId, estado: EstadoDonacion.RESERVADA }, data: { estado: EstadoDonacion.RETIRADA, retiradaAt: now } });
    if (result.count !== 1) throw new ApiError(409, CONCURRENT);
    await transaction.auditoriaAdministrativa.create({ data: { administradorId: adminId, accion: AccionAuditoriaAdministrativa.DONACION_RESERVADA_RETIRADA, entidad: "DONACION", entidadId: String(donationId), motivo, metadata: { estadoAnterior: EstadoDonacion.RESERVADA, estadoNuevo: EstadoDonacion.RETIRADA, resolucion: "RETIRAR" } } });
    return { donacion: await transaction.donacion.findUniqueOrThrow({ where: { id: donationId }, select: adminDonationSelect }), actualizado: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

export async function exemptPendingRating(adminId: number, donationId: number, motivo: string) {
  try {
    return await withSerializableRetry(() => prisma.$transaction(async (transaction) => {
      const donation = await transaction.donacion.findUnique({ where: { id: donationId }, select: { id: true, estado: true, solicitudAceptadaId: true, calificacion: { select: { id: true } }, exencionCalificacion: { select: { id: true, donacionId: true, motivo: true, createdAt: true, administrador: { select: adminPublicUserSelect } } }, solicitudAceptada: { select: { id: true, estado: true, donacionId: true } } } });
      if (donation === null) throw new ApiError(404, NOT_FOUND);
      if (donation.exencionCalificacion !== null) return { exencion: donation.exencionCalificacion, creada: false };
      const request = donation.solicitudAceptada;
      if (donation.estado !== EstadoDonacion.ENTREGADA || donation.calificacion !== null || request === null || request.id !== donation.solicitudAceptadaId || request.donacionId !== donation.id || request.estado !== EstadoSolicitud.ACEPTADA) throw new ApiError(409, INCOMPATIBLE);
      const exemption = await transaction.exencionCalificacion.create({ data: { donacionId: donationId, administradorId: adminId, motivo }, select: { id: true, donacionId: true, motivo: true, createdAt: true, administrador: { select: adminPublicUserSelect } } });
      await transaction.auditoriaAdministrativa.create({ data: { administradorId: adminId, accion: AccionAuditoriaAdministrativa.CALIFICACION_PENDIENTE_EXIMIDA, entidad: "DONACION", entidadId: String(donationId), motivo, metadata: { exencionId: exemption.id } } });
      return { exencion: exemption, creada: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const exemption = await prisma.exencionCalificacion.findUnique({ where: { donacionId: donationId }, select: { id: true, donacionId: true, motivo: true, createdAt: true, administrador: { select: adminPublicUserSelect } } });
      if (exemption !== null) return { exencion: exemption, creada: false };
    }
    throw error;
  }
}
