import { Prisma } from "@/generated/prisma/client";

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

export function findSafeProfileById(userId: number) {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: SAFE_PROFILE_SELECT,
  });
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
