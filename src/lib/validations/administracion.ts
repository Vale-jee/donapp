import { z } from "zod";

import {
  AccionAuditoriaAdministrativa,
  CausaCancelacionSolicitud,
  EstadoDonacion,
  EstadoSolicitud,
  RolCodigo,
} from "@/generated/prisma/client";

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;
const positiveInteger = z.string().regex(POSITIVE_INTEGER_PATTERN).transform(Number).refine(Number.isSafeInteger);
const optionalPositiveInteger = positiveInteger.optional();
const page = positiveInteger.optional().transform((value) => value ?? 1);
const limit = positiveInteger.optional().transform((value) => value ?? 20).refine((value) => value <= 100);
const booleanQuery = z.enum(["true", "false"]).transform((value) => value === "true");
const trimmedOptional = z.string().trim().min(1).optional();
const dateQuery = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const adminIdQuerySchema = z.strictObject({ id: positiveInteger });
export const adminDonationIdQuerySchema = z.strictObject({ donacionId: positiveInteger });

const SENSITIVE_REASON_PATTERN = /(bearer\s+\S+|password\s*[:=]\s*\S+|secret\s*[:=]\s*\S+|database_url\s*=|begin(?:\s+\w+)?\s+private key)/iu;
export const adminReasonSchema = z.string().trim().min(10, "El motivo debe tener al menos 10 caracteres.").max(500, "El motivo no puede superar 500 caracteres.").refine((value) => !SENSITIVE_REASON_PATTERN.test(value), "El motivo contiene información sensible no permitida.");
export const adminStateSchema = z.strictObject({ activo: z.boolean(), motivo: adminReasonSchema });
export const adminReasonBodySchema = z.strictObject({ motivo: adminReasonSchema });
export const adminResolutionSchema = z.strictObject({ resolucion: z.literal("RETIRAR"), motivo: adminReasonSchema });

export const adminUsersQuerySchema = z.strictObject({ page, limit, activo: booleanQuery.optional(), rol: z.enum(RolCodigo).optional(), ciudad: trimmedOptional });
export const adminDonationsQuerySchema = z.strictObject({ page, limit, estado: z.enum(EstadoDonacion).optional(), ciudad: trimmedOptional, categoriaId: optionalPositiveInteger, propietarioId: optionalPositiveInteger });
export const adminRequestsQuerySchema = z.strictObject({ page, limit, estado: z.enum(EstadoSolicitud).optional(), causaCancelacion: z.enum(CausaCancelacionSolicitud).optional(), donacionId: optionalPositiveInteger, solicitanteId: optionalPositiveInteger });
export const adminChatsQuerySchema = z.strictObject({ page, limit });
export const adminRatingsQuerySchema = z.strictObject({ page, limit, puntuacion: positiveInteger.optional().refine((value) => value === undefined || value <= 5), propietarioId: optionalPositiveInteger, receptorId: optionalPositiveInteger, donacionId: optionalPositiveInteger });
export const adminAuditsQuerySchema = z.strictObject({ page, limit, administradorId: optionalPositiveInteger, accion: z.enum(AccionAuditoriaAdministrativa).optional(), entidad: trimmedOptional, entidadId: trimmedOptional, fechaDesde: dateQuery.optional(), fechaHasta: dateQuery.optional() }).refine((value) => value.fechaDesde === undefined || value.fechaHasta === undefined || value.fechaDesde <= value.fechaHasta, "El rango de fechas no es válido.");

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type AdminDonationsQuery = z.infer<typeof adminDonationsQuerySchema>;
export type AdminRequestsQuery = z.infer<typeof adminRequestsQuerySchema>;
export type AdminChatsQuery = z.infer<typeof adminChatsQuerySchema>;
export type AdminRatingsQuery = z.infer<typeof adminRatingsQuerySchema>;
export type AdminAuditsQuery = z.infer<typeof adminAuditsQuerySchema>;
