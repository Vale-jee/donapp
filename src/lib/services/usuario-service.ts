import { Prisma } from "@/generated/prisma/client";
import {
  changePasswordAndRevokeSessions,
  deactivateOwnAccount,
  findActivePublicProfileById,
  findProfileConflict,
  findProfileUpdateContext,
  findSafeProfileById,
  findUserPasswordContext,
  updateProfile,
} from "@/database/usuarios";
import { ApiError } from "@/src/lib/api/errors";
import { hashPassword, verifyPassword } from "@/src/lib/auth/password";
import type { Role } from "@/src/lib/auth/types";
import type {
  ChangePasswordInput,
  DeactivateAccountInput,
  UpdateProfileInput,
} from "@/src/lib/validations/usuario";

const INVALID_ACCESS_TOKEN_MESSAGE = "Access token inválido.";
const INVALID_CURRENT_PASSWORD_MESSAGE =
  "La contraseña actual es incorrecta.";
const EMAIL_CONFLICT_MESSAGE = "El correo electrónico ya está registrado.";
const USERNAME_CONFLICT_MESSAGE = "El nombre visible ya está en uso.";
const GENERIC_CONFLICT_MESSAGE = "Ya existe un usuario con esos datos.";
const PUBLIC_PROFILE_NOT_FOUND_MESSAGE = "Perfil público no encontrado.";
const CONCURRENT_ACCOUNT_CHANGE_MESSAGE =
  "La cuenta cambió mientras se procesaba la operación.";
const LAST_ADMINISTRATOR_MESSAGE =
  "Debe permanecer al menos un administrador activo.";
const MAX_TRANSACTION_ATTEMPTS = 3;

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

export interface PublicUserProfile {
  id: number;
  nombreVisible: string;
  fotoPerfil: string | null;
  ciudad: string;
}

function isRetryableTransactionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

async function withTransactionRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (!isRetryableTransactionError(error)) {
        throw error;
      }

      if (attempt === MAX_TRANSACTION_ATTEMPTS) {
        throw new ApiError(409, CONCURRENT_ACCOUNT_CHANGE_MESSAGE);
      }
    }
  }

  throw new ApiError(409, CONCURRENT_ACCOUNT_CHANGE_MESSAGE);
}

export async function getPublicUserProfile(
  userId: number,
): Promise<PublicUserProfile> {
  const usuario = await findActivePublicProfileById(userId);

  if (usuario === null) {
    throw new ApiError(404, PUBLIC_PROFILE_NOT_FOUND_MESSAGE);
  }

  return usuario;
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

async function verifyCurrentPasswordForUser(
  userId: number,
  password: string,
): Promise<string> {
  const context = await findUserPasswordContext(userId);

  if (context === null) {
    throw new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
  }

  if (!(await verifyPassword(password, context.passwordHash))) {
    throw new ApiError(401, INVALID_CURRENT_PASSWORD_MESSAGE);
  }

  return context.passwordHash;
}

export async function changeAuthenticatedUserPassword(
  userId: number,
  input: ChangePasswordInput,
): Promise<void> {
  const previousPasswordHash = await verifyCurrentPasswordForUser(
    userId,
    input.passwordActual,
  );
  const newPasswordHash = await hashPassword(input.passwordNueva);
  const result = await withTransactionRetry(() =>
    changePasswordAndRevokeSessions(
      userId,
      previousPasswordHash,
      newPasswordHash,
    ),
  );

  if (result === null) {
    throw new ApiError(409, CONCURRENT_ACCOUNT_CHANGE_MESSAGE);
  }
}

export async function deactivateAuthenticatedUser(
  userId: number,
  input: DeactivateAccountInput,
): Promise<void> {
  const passwordHash = await verifyCurrentPasswordForUser(
    userId,
    input.passwordActual,
  );
  const result = await withTransactionRetry(() =>
    deactivateOwnAccount(userId, passwordHash),
  );

  if (result === null) {
    throw new ApiError(409, CONCURRENT_ACCOUNT_CHANGE_MESSAGE);
  }

  if (result.lastAdministrator) {
    throw new ApiError(409, LAST_ADMINISTRATOR_MESSAGE);
  }
}
