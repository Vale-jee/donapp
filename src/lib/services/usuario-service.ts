import { prisma } from "@/database/client";
import { ApiError } from "@/src/lib/api/errors";
import type { Role } from "@/src/lib/auth/types";

const INVALID_ACCESS_TOKEN_MESSAGE = "Access token inválido.";

export interface AuthenticatedUserProfile {
  id: number;
  nombreCompleto: string;
  nombreVisible: string;
  email: string;
  ciudad: string;
  telefono: string | null;
  fotoPerfil: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  rol: {
    codigo: Role;
    nombre: string;
  };
}

export async function getAuthenticatedUserProfile(
  userId: number,
): Promise<AuthenticatedUserProfile> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
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
      rol: {
        select: {
          codigo: true,
          nombre: true,
        },
      },
    },
  });

  if (usuario === null) {
    throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
  }

  return usuario;
}
