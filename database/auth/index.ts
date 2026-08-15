import { RolCodigo } from "@/generated/prisma/client";

import { prisma } from "@/database/client";

export function findDefaultUserRole() {
  return prisma.rol.findUnique({
    where: { codigo: RolCodigo.USUARIO },
    select: { id: true },
  });
}

export function findRegistrationConflict(email: string, nombreVisible: string) {
  return prisma.usuario.findFirst({
    where: { OR: [{ email }, { nombreVisible }] },
    select: { email: true, nombreVisible: true },
  });
}

export function createRegisteredUser(data: {
  nombreCompleto: string;
  nombreVisible: string;
  email: string;
  passwordHash: string;
  ciudad: string;
  telefono?: string | null;
  fotoPerfil?: string | null;
  rolId: number;
}) {
  return prisma.usuario.create({ data, select: { id: true } });
}

export function findUserForLogin(email: string) {
  return prisma.usuario.findUnique({
    where: { email },
    select: {
      id: true,
      nombreVisible: true,
      fotoPerfil: true,
      passwordHash: true,
      activo: true,
      rol: { select: { codigo: true, nombre: true } },
    },
  });
}

export function revokeActiveSessionByRefreshTokenHash(
  refreshTokenHash: string,
  now: Date,
) {
  return prisma.sesion.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { revokedAt: now },
  });
}

export function findAuthenticatedSession(sessionId: string) {
  return prisma.sesion.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      usuario: {
        select: {
          id: true,
          activo: true,
          ciudad: true,
          rol: { select: { codigo: true } },
        },
      },
    },
  });
}
