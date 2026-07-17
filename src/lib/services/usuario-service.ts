import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import { ApiError } from "@/src/lib/api/errors";
import { verifyPassword } from "@/src/lib/auth/password";
import type { Role } from "@/src/lib/auth/types";
import type { UpdateProfileInput } from "@/src/lib/validations/usuario";

const INVALID_ACCESS_TOKEN_MESSAGE = "Access token inválido.";
const INVALID_CURRENT_PASSWORD_MESSAGE =
  "La contraseña actual es incorrecta.";
const EMAIL_CONFLICT_MESSAGE = "El correo electrónico ya está registrado.";
const USERNAME_CONFLICT_MESSAGE = "El nombre visible ya está en uso.";
const GENERIC_CONFLICT_MESSAGE = "Ya existe un usuario con esos datos.";

const SAFE_PROFILE_SELECT = {
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
} satisfies Prisma.UsuarioSelect;

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
    select: SAFE_PROFILE_SELECT,
  });

  if (usuario === null) {
    throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
  }

  return usuario;
}

function translateProfileUpdateError(error: unknown): never {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    throw error;
  }

  if (error.code === "P2025") {
    throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
  }

  if (error.code !== "P2002") {
    throw error;
  }

  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.filter((value): value is string => typeof value === "string")
    : typeof target === "string"
      ? [target]
      : [];

  if (fields.includes("email")) {
    throw new ApiError(409, EMAIL_CONFLICT_MESSAGE);
  }

  if (fields.includes("nombreVisible")) {
    throw new ApiError(409, USERNAME_CONFLICT_MESSAGE);
  }

  throw new ApiError(409, GENERIC_CONFLICT_MESSAGE);
}

export async function updateAuthenticatedUserProfile(
  userId: number,
  input: UpdateProfileInput,
): Promise<AuthenticatedUserProfile> {
  const currentUser = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      email: true,
      nombreVisible: true,
      ...(input.email === undefined ? {} : { passwordHash: true }),
    },
  });

  if (currentUser === null) {
    throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
  }

  if (input.email !== undefined) {
    if (
      !("passwordHash" in currentUser) ||
      input.passwordActual === undefined
    ) {
      throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
    }

    const passwordIsValid = await verifyPassword(
      input.passwordActual,
      currentUser.passwordHash,
    );

    if (!passwordIsValid) {
      throw new ApiError(401, INVALID_CURRENT_PASSWORD_MESSAGE);
    }
  }

  const emailChanged =
    input.email !== undefined && input.email !== currentUser.email;
  const usernameChanged =
    input.nombreVisible !== undefined &&
    input.nombreVisible !== currentUser.nombreVisible;

  if (emailChanged || usernameChanged) {
    const conflict = await prisma.usuario.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(emailChanged ? [{ email: input.email }] : []),
          ...(usernameChanged ? [{ nombreVisible: input.nombreVisible }] : []),
        ],
      },
      select: {
        email: true,
        nombreVisible: true,
      },
    });

    if (emailChanged && conflict?.email === input.email) {
      throw new ApiError(409, EMAIL_CONFLICT_MESSAGE);
    }

    if (
      usernameChanged &&
      conflict?.nombreVisible === input.nombreVisible
    ) {
      throw new ApiError(409, USERNAME_CONFLICT_MESSAGE);
    }
  }

  try {
    return await prisma.usuario.update({
      where: { id: userId },
      data: {
        ...(input.nombreCompleto === undefined
          ? {}
          : { nombreCompleto: input.nombreCompleto }),
        ...(input.nombreVisible === undefined
          ? {}
          : { nombreVisible: input.nombreVisible }),
        ...(input.email === undefined ? {} : { email: input.email }),
        ...(input.ciudad === undefined ? {} : { ciudad: input.ciudad }),
        ...(input.telefono === undefined
          ? {}
          : { telefono: input.telefono }),
        ...(input.fotoPerfil === undefined
          ? {}
          : { fotoPerfil: input.fotoPerfil }),
      },
      select: SAFE_PROFILE_SELECT,
    });
  } catch (error: unknown) {
    translateProfileUpdateError(error);
  }
}
