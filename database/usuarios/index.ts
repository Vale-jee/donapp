import {
  CausaCancelacionSolicitud,
  EstadoDonacion,
  EstadoSolicitud,
  Prisma,
  RolCodigo,
} from "@/generated/prisma/client";

import { prisma } from "@/database/client";
import type { UpdateProfileInput } from "@/src/lib/validations/usuario";

export const SAFE_PROFILE_SELECT = {
  id: true,
  nombreCompleto: true,
  nombreVisible: true,
  email: true,
  ciudad: true,
  telefono: true,
  fotoPerfil: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  rol: { select: { codigo: true, nombre: true } },
} satisfies Prisma.UsuarioSelect;

export const PUBLIC_PROFILE_SELECT = {
  id: true,
  nombreVisible: true,
  fotoPerfil: true,
  ciudad: true,
} satisfies Prisma.UsuarioSelect;

export function findSafeProfileById(userId: number) {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: SAFE_PROFILE_SELECT,
  });
}

export function findActivePublicProfileById(userId: number) {
  return prisma.usuario.findFirst({
    where: { id: userId, activo: true },
    select: PUBLIC_PROFILE_SELECT,
  });
}

export function findUserPasswordContext(userId: number) {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
}

export function changePasswordAndRevokeSessions(
  userId: number,
  previousPasswordHash: string,
  newPasswordHash: string,
) {
  return prisma.$transaction(
    async (transaction) => {
      const updated = await transaction.usuario.updateMany({
        where: {
          id: userId,
          activo: true,
          passwordHash: previousPasswordHash,
        },
        data: { passwordHash: newPasswordHash },
      });

      if (updated.count !== 1) {
        return null;
      }

      const now = new Date();
      const sessions = await transaction.sesion.updateMany({
        where: { usuarioId: userId, revokedAt: null },
        data: { revokedAt: now },
      });

      return { sessionsRevoked: sessions.count };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export function deactivateOwnAccount(
  userId: number,
  expectedPasswordHash: string,
) {
  return prisma.$transaction(
    async (transaction) => {
      const target = await transaction.usuario.findUnique({
        where: { id: userId },
        select: {
          activo: true,
          passwordHash: true,
          rol: { select: { codigo: true } },
        },
      });

      if (
        target === null ||
        !target.activo ||
        target.passwordHash !== expectedPasswordHash
      ) {
        return null;
      }

      if (target.rol.codigo === RolCodigo.ADMIN) {
        const activeAdministrators = await transaction.usuario.count({
          where: { activo: true, rol: { codigo: RolCodigo.ADMIN } },
        });

        if (activeAdministrators <= 1) {
          return { lastAdministrator: true as const };
        }
      }

      const now = new Date();
      const updated = await transaction.usuario.updateMany({
        where: {
          id: userId,
          activo: true,
          passwordHash: expectedPasswordHash,
        },
        data: { activo: false },
      });

      if (updated.count !== 1) {
        return null;
      }

      const publishedDonations = await transaction.donacion.findMany({
        where: { propietarioId: userId, estado: EstadoDonacion.PUBLICADA },
        select: { id: true },
      });
      const donationIds = publishedDonations.map((donation) => donation.id);

      const sessions = await transaction.sesion.updateMany({
        where: { usuarioId: userId, revokedAt: null },
        data: { revokedAt: now },
      });
      const donations = await transaction.donacion.updateMany({
        where: {
          id: { in: donationIds },
          propietarioId: userId,
          estado: EstadoDonacion.PUBLICADA,
        },
        data: { estado: EstadoDonacion.RETIRADA, retiradaAt: now },
      });
      const ownRequests = await transaction.solicitud.updateMany({
        where: { solicitanteId: userId, estado: EstadoSolicitud.PENDIENTE },
        data: {
          estado: EstadoSolicitud.CANCELADA,
          causaCancelacion: CausaCancelacionSolicitud.USUARIO_INACTIVO,
          canceladaAt: now,
        },
      });
      const receivedRequests = await transaction.solicitud.updateMany({
        where: {
          donacionId: { in: donationIds },
          estado: EstadoSolicitud.PENDIENTE,
        },
        data: {
          estado: EstadoSolicitud.CANCELADA,
          causaCancelacion: CausaCancelacionSolicitud.DONACION_RETIRADA,
          canceladaAt: now,
        },
      });

      return {
        lastAdministrator: false as const,
        sessionsRevoked: sessions.count,
        donationsWithdrawn: donations.count,
        requestsCancelled: ownRequests.count + receivedRequests.count,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export function findProfileUpdateContext(
  userId: number,
  includePasswordHash: boolean,
) {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      email: true,
      nombreVisible: true,
      ...(includePasswordHash ? { passwordHash: true } : {}),
    },
  });
}

export function findProfileConflict(
  userId: number,
  email?: string,
  nombreVisible?: string,
) {
  return prisma.usuario.findFirst({
    where: {
      id: { not: userId },
      OR: [
        ...(email === undefined ? [] : [{ email }]),
        ...(nombreVisible === undefined ? [] : [{ nombreVisible }]),
      ],
    },
    select: { email: true, nombreVisible: true },
  });
}

export function updateProfile(userId: number, input: UpdateProfileInput) {
  return prisma.usuario.update({
    where: { id: userId },
    data: {
      ...(input.nombreCompleto === undefined ? {} : { nombreCompleto: input.nombreCompleto }),
      ...(input.nombreVisible === undefined ? {} : { nombreVisible: input.nombreVisible }),
      ...(input.email === undefined ? {} : { email: input.email }),
      ...(input.ciudad === undefined ? {} : { ciudad: input.ciudad }),
      ...(input.telefono === undefined ? {} : { telefono: input.telefono }),
      ...(input.fotoPerfil === undefined ? {} : { fotoPerfil: input.fotoPerfil }),
    },
    select: SAFE_PROFILE_SELECT,
  });
}
