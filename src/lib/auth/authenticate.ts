import type { NextApiRequest } from "next";
import { errors as joseErrors } from "jose";
import { ZodError } from "zod";

import { prisma } from "@/database/client";
import { ApiError } from "@/src/lib/api/errors";

import { verifyAccessToken } from "./access-token";
import type { AccessTokenPayload, Role } from "./types";

const INVALID_ACCESS_TOKEN_MESSAGE = "Access token inválido.";
const INACTIVE_ACCOUNT_MESSAGE = "La cuenta se encuentra inactiva.";
const INSUFFICIENT_ROLE_MESSAGE =
  "No tiene permisos para realizar esta operación.";

export interface AuthContext {
  userId: number;
  sessionId: string;
  role: Role;
}

function invalidAccessToken(): ApiError {
  return new ApiError(401, INVALID_ACCESS_TOKEN_MESSAGE);
}

function extractBearerToken(request: NextApiRequest): string {
  let authorizationHeaderCount = 0;

  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index]?.toLowerCase() === "authorization") {
      authorizationHeaderCount += 1;
    }
  }

  if (authorizationHeaderCount !== 1) {
    throw invalidAccessToken();
  }

  const authorization = request.headers.authorization;

  if (typeof authorization !== "string") {
    throw invalidAccessToken();
  }

  const match = /^Bearer ([^\s,]+)$/iu.exec(authorization);

  if (match === null) {
    throw invalidAccessToken();
  }

  return match[1];
}

async function verifyAccessTokenSafely(
  token: string,
): Promise<AccessTokenPayload> {
  try {
    return await verifyAccessToken(token);
  } catch (error: unknown) {
    if (error instanceof joseErrors.JOSEError || error instanceof ZodError) {
      throw invalidAccessToken();
    }

    throw error;
  }
}

export async function requireAuth(
  request: NextApiRequest,
): Promise<AuthContext> {
  const token = extractBearerToken(request);
  const payload = await verifyAccessTokenSafely(token);
  const now = new Date();

  const session = await prisma.sesion.findUnique({
    where: { id: payload.sid },
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

  if (
    session === null ||
    String(session.usuario.id) !== payload.sub ||
    session.revokedAt !== null ||
    session.expiresAt <= now
  ) {
    throw invalidAccessToken();
  }

  if (!session.usuario.activo) {
    throw new ApiError(403, INACTIVE_ACCOUNT_MESSAGE);
  }

  return {
    userId: session.usuario.id,
    sessionId: session.id,
    role: session.usuario.rol.codigo,
  };
}

export function requireRole(
  authContext: AuthContext,
  allowedRoles: readonly Role[],
): void {
  if (!allowedRoles.includes(authContext.role)) {
    throw new ApiError(403, INSUFFICIENT_ROLE_MESSAGE);
  }
}
