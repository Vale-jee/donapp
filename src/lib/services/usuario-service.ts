import { Prisma } from "@/generated/prisma/client";
import {
  findProfileConflict,
  findProfileUpdateContext,
  findSafeProfileById,
  updateProfile,
} from "@/database/usuarios";
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
  const usuario = await findSafeProfileById(userId);

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
  const currentUser = await findProfileUpdateContext(
    userId,
    input.email !== undefined,
  );

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
    const conflict = await findProfileConflict(
      userId,
      emailChanged ? input.email : undefined,
      usernameChanged ? input.nombreVisible : undefined,
    );

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
    return await updateProfile(userId, input);
  } catch (error: unknown) {
    translateProfileUpdateError(error);
  }
}
