import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import {
  createRegisteredUser,
  findDefaultUserRole,
  findRegistrationConflict,
  findUserForLogin,
  revokeActiveSessionByRefreshTokenHash,
} from "@/database/auth";
import { ApiError } from "@/src/lib/api/errors";
import { createAccessToken } from "@/src/lib/auth/access-token";
import { hashPassword, verifyPassword } from "@/src/lib/auth/password";
import {
  generateRefreshToken,
  getRefreshTokenExpirationDate,
  hashRefreshToken,
} from "@/src/lib/auth/refresh-token";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_MILLISECONDS,
} from "@/src/lib/auth/types";
import type {
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
} from "@/src/lib/validations/auth";

const EMAIL_CONFLICT_MESSAGE = "El correo electrónico ya está registrado.";
const USERNAME_CONFLICT_MESSAGE = "El nombre visible ya está en uso.";
const GENERIC_CONFLICT_MESSAGE = "Ya existe un usuario con esos datos.";
const INVALID_CREDENTIALS_MESSAGE =
  "Correo electrónico o contraseña incorrectos.";
const INACTIVE_ACCOUNT_MESSAGE = "La cuenta se encuentra inactiva.";
const INVALID_REFRESH_TOKEN_MESSAGE = "Refresh token inválido.";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  usuario: {
    id: number;
    nombreVisible: string;
    fotoPerfil: string | null;
    rol: {
      codigo: "ADMIN" | "USUARIO";
      nombre: string;
    };
  };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

function translateUniqueConflict(error: unknown): never {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
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

export async function registerUser(input: RegisterInput): Promise<void> {
  const role = await findDefaultUserRole();

  if (role === null) {
    throw new Error("El rol USUARIO requerido no existe.");
  }

  const conflict = await findRegistrationConflict(
    input.email,
    input.nombreVisible,
  );

  if (conflict?.email === input.email) {
    throw new ApiError(409, EMAIL_CONFLICT_MESSAGE);
  }

  if (conflict?.nombreVisible === input.nombreVisible) {
    throw new ApiError(409, USERNAME_CONFLICT_MESSAGE);
  }

  const passwordHash = await hashPassword(input.password);

  try {
    await createRegisteredUser({
      nombreCompleto: input.nombreCompleto,
      nombreVisible: input.nombreVisible,
      email: input.email,
      passwordHash,
      ciudad: input.ciudad,
      telefono: input.telefono,
      fotoPerfil: input.fotoPerfil,
      rolId: role.id,
    });
  } catch (error: unknown) {
    translateUniqueConflict(error);
  }
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const user = await findUserForLogin(input.email);

  if (user === null) {
    throw new ApiError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordIsValid = await verifyPassword(
    input.password,
    user.passwordHash,
  );

  if (!passwordIsValid) {
    throw new ApiError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  if (!user.activo) {
    throw new ApiError(403, INACTIVE_ACCOUNT_MESSAGE);
  }

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshTokenExpirationDate();

  const accessToken = await prisma.$transaction(async (transaction) => {
    const session = await transaction.sesion.create({
      data: {
        usuarioId: user.id,
        refreshTokenHash,
        expiresAt,
        revokedAt: null,
      },
      select: { id: true },
    });

    return createAccessToken({
      sub: String(user.id),
      sid: session.id,
      role: user.rol.codigo,
    });
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresIn: REFRESH_TOKEN_TTL_MILLISECONDS / 1000,
    usuario: {
      id: user.id,
      nombreVisible: user.nombreVisible,
      fotoPerfil: user.fotoPerfil,
      rol: {
        codigo: user.rol.codigo,
        nombre: user.rol.nombre,
      },
    },
  };
}

export async function refreshTokens(
  input: RefreshInput,
): Promise<RefreshResult> {
  const previousRefreshTokenHash = hashRefreshToken(input.refreshToken);

  return prisma.$transaction(async (transaction) => {
    const session = await transaction.sesion.findUnique({
      where: { refreshTokenHash: previousRefreshTokenHash },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        usuario: {
          select: {
            id: true,
            activo: true,
            rol: {
              select: { codigo: true },
            },
          },
        },
      },
    });

    const now = new Date();

    if (
      session === null ||
      session.revokedAt !== null ||
      session.expiresAt <= now
    ) {
      throw new ApiError(401, INVALID_REFRESH_TOKEN_MESSAGE);
    }

    if (!session.usuario.activo) {
      throw new ApiError(403, INACTIVE_ACCOUNT_MESSAGE);
    }

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = getRefreshTokenExpirationDate();

    const rotation = await transaction.sesion.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: previousRefreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        refreshTokenHash,
        expiresAt,
        revokedAt: null,
      },
    });

    if (rotation.count !== 1) {
      throw new ApiError(401, INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const accessToken = await createAccessToken({
      sub: String(session.usuario.id),
      sid: session.id,
      role: session.usuario.rol.codigo,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenExpiresIn: REFRESH_TOKEN_TTL_MILLISECONDS / 1000,
    };
  });
}

export async function logoutUser(input: LogoutInput): Promise<void> {
  const refreshTokenHash = hashRefreshToken(input.refreshToken);
  const now = new Date();

  const revocation = await revokeActiveSessionByRefreshTokenHash(
    refreshTokenHash,
    now,
  );

  if (revocation.count !== 1) {
    throw new ApiError(401, INVALID_REFRESH_TOKEN_MESSAGE);
  }
}
