import { EstadoDonacion, EstadoSolicitud, Prisma } from "@/generated/prisma/client";

import { prisma } from "@/database/client";
import type {
  AdminAuditsQuery,
  AdminChatsQuery,
  AdminDonationsQuery,
  AdminRatingsQuery,
  AdminRequestsQuery,
  AdminUsersQuery,
} from "@/src/lib/validations/administracion";

export const adminPublicUserSelect = { id: true, nombreVisible: true, fotoPerfil: true, activo: true } as const;
export const adminUserSummarySelect = { id: true, nombreVisible: true, fotoPerfil: true, ciudad: true, activo: true, createdAt: true, updatedAt: true, rol: { select: { codigo: true } } } satisfies Prisma.UsuarioSelect;
export const adminDonationSummarySelect = {
  id: true, titulo: true, ciudad: true, estado: true, entregadaAt: true, retiradaAt: true, createdAt: true, updatedAt: true,
  propietario: { select: adminPublicUserSelect }, categoria: { select: { id: true, nombre: true, activo: true } },
  solicitudAceptada: { select: { id: true, solicitante: { select: adminPublicUserSelect } } },
} satisfies Prisma.DonacionSelect;
export const adminDonationSelect = {
  id: true, titulo: true, descripcion: true, ciudad: true, estado: true,
  donanteConfirmoAt: true, receptorConfirmoAt: true, entregadaAt: true, retiradaAt: true, createdAt: true, updatedAt: true,
  propietario: { select: adminPublicUserSelect }, categoria: { select: { id: true, nombre: true, activo: true } },
  imagenes: { select: { id: true, referencia: true, orden: true }, orderBy: { orden: "asc" as const } },
  solicitudAceptada: { select: { id: true, estado: true, donacionId: true, solicitante: { select: adminPublicUserSelect }, chat: { select: { id: true, _count: { select: { mensajes: true } } } } } },
  calificacion: { select: { id: true, puntuacion: true, createdAt: true } }, exencionCalificacion: { select: { id: true, createdAt: true } },
  solicitudes: { select: { estado: true } },
} satisfies Prisma.DonacionSelect;
export const adminRequestSelect = {
  id: true, estado: true, causaCancelacion: true, aceptadaAt: true, rechazadaAt: true, canceladaAt: true, createdAt: true, updatedAt: true,
  solicitante: { select: adminPublicUserSelect }, chat: { select: { id: true } }, seleccionadaEnDonacion: { select: { id: true } },
  donacion: { select: { id: true, titulo: true, estado: true, solicitudAceptadaId: true, propietario: { select: adminPublicUserSelect } } },
} satisfies Prisma.SolicitudSelect;
export const adminChatSelect = {
  id: true, solicitudId: true, createdAt: true, updatedAt: true, ultimoMensajeAt: true, _count: { select: { mensajes: true } },
  solicitud: { select: { solicitante: { select: adminPublicUserSelect }, donacion: { select: { id: true, titulo: true, estado: true, propietario: { select: adminPublicUserSelect } } } } },
} satisfies Prisma.ChatSelect;
export const adminRatingSelect = {
  id: true, puntuacion: true, createdAt: true,
  donacion: { select: { id: true, titulo: true, estado: true, propietario: { select: adminPublicUserSelect }, solicitudAceptada: { select: { solicitante: { select: adminPublicUserSelect } } } } },
} satisfies Prisma.CalificacionSelect;
export const adminAuditSelect = {
  id: true, accion: true, entidad: true, entidadId: true, motivo: true, metadata: true, createdAt: true,
  administrador: { select: { id: true, nombreVisible: true, fotoPerfil: true } },
} satisfies Prisma.AuditoriaAdministrativaSelect;

const pagination = (page: number, limit: number, total: number) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });

export async function listAdminUsers(query: AdminUsersQuery) {
  const where = { ...(query.activo === undefined ? {} : { activo: query.activo }), ...(query.rol === undefined ? {} : { rol: { codigo: query.rol } }), ...(query.ciudad === undefined ? {} : { ciudad: query.ciudad }) } satisfies Prisma.UsuarioWhereInput;
  const [items, total] = await prisma.$transaction([prisma.usuario.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: adminUserSummarySelect }), prisma.usuario.count({ where })]);
  return { usuarios: items.map(({ rol, ...user }) => ({ ...user, rol: rol.codigo })), pagination: pagination(query.page, query.limit, total) };
}
export async function listAdminDonations(query: AdminDonationsQuery) {
  const where = { ...(query.estado === undefined ? {} : { estado: query.estado }), ...(query.ciudad === undefined ? {} : { ciudad: query.ciudad }), ...(query.categoriaId === undefined ? {} : { categoriaId: query.categoriaId }), ...(query.propietarioId === undefined ? {} : { propietarioId: query.propietarioId }) } satisfies Prisma.DonacionWhereInput;
  const [items, total] = await prisma.$transaction([prisma.donacion.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: adminDonationSummarySelect }), prisma.donacion.count({ where })]);
  return {
    donaciones: items.map((donation) => ({
      ...donation,
      bloqueada:
        donation.estado === EstadoDonacion.RESERVADA &&
        donation.solicitudAceptada !== null &&
        (!donation.propietario.activo ||
          !donation.solicitudAceptada.solicitante.activo),
    })),
    pagination: pagination(query.page, query.limit, total),
  };
}
export async function listAdminRequests(query: AdminRequestsQuery) {
  const where = { ...(query.estado === undefined ? {} : { estado: query.estado }), ...(query.causaCancelacion === undefined ? {} : { causaCancelacion: query.causaCancelacion }), ...(query.donacionId === undefined ? {} : { donacionId: query.donacionId }), ...(query.solicitanteId === undefined ? {} : { solicitanteId: query.solicitanteId }) } satisfies Prisma.SolicitudWhereInput;
  const [items, total] = await prisma.$transaction([prisma.solicitud.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: adminRequestSelect }), prisma.solicitud.count({ where })]);
  return { solicitudes: items, pagination: pagination(query.page, query.limit, total) };
}
export async function listAdminChats(query: AdminChatsQuery) {
  const [items, total] = await prisma.$transaction([prisma.chat.findMany({ skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: adminChatSelect }), prisma.chat.count()]);
  return { chats: items, pagination: pagination(query.page, query.limit, total) };
}
export async function listAdminRatings(query: AdminRatingsQuery) {
  const where = { ...(query.puntuacion === undefined ? {} : { puntuacion: query.puntuacion }), donacion: { ...(query.propietarioId === undefined ? {} : { propietarioId: query.propietarioId }), ...(query.donacionId === undefined ? {} : { id: query.donacionId }), ...(query.receptorId === undefined ? {} : { solicitudAceptada: { solicitanteId: query.receptorId } }) } } satisfies Prisma.CalificacionWhereInput;
  const [items, total] = await prisma.$transaction([prisma.calificacion.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: adminRatingSelect }), prisma.calificacion.count({ where })]);
  return { calificaciones: items, pagination: pagination(query.page, query.limit, total) };
}
export async function listAdminAudits(query: AdminAuditsQuery) {
  const where = { ...(query.administradorId === undefined ? {} : { administradorId: query.administradorId }), ...(query.accion === undefined ? {} : { accion: query.accion }), ...(query.entidad === undefined ? {} : { entidad: query.entidad }), ...(query.entidadId === undefined ? {} : { entidadId: query.entidadId }), ...((query.fechaDesde === undefined && query.fechaHasta === undefined) ? {} : { createdAt: { ...(query.fechaDesde === undefined ? {} : { gte: query.fechaDesde }), ...(query.fechaHasta === undefined ? {} : { lte: query.fechaHasta }) } }) } satisfies Prisma.AuditoriaAdministrativaWhereInput;
  const [items, total] = await prisma.$transaction([prisma.auditoriaAdministrativa.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: adminAuditSelect }), prisma.auditoriaAdministrativa.count({ where })]);
  return { auditorias: items, pagination: pagination(query.page, query.limit, total) };
}

export const findAdminDonation = (id: number) => prisma.donacion.findUnique({ where: { id }, select: adminDonationSelect });
export const findAdminRequest = (id: number) => prisma.solicitud.findUnique({ where: { id }, select: adminRequestSelect });
export const findAdminChat = (id: number) => prisma.chat.findUnique({ where: { id }, select: adminChatSelect });
export const findAdminRating = (id: number) => prisma.calificacion.findUnique({ where: { id }, select: adminRatingSelect });
export const findAdminAudit = (id: number) => prisma.auditoriaAdministrativa.findUnique({ where: { id }, select: adminAuditSelect });

export const pendingRatingWhere = (userId: number) => ({ estado: EstadoDonacion.ENTREGADA, solicitudAceptada: { estado: EstadoSolicitud.ACEPTADA, solicitanteId: userId }, calificacion: null, exencionCalificacion: null }) satisfies Prisma.DonacionWhereInput;
