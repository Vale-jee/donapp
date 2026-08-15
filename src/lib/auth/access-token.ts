import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

import { env } from "@/src/lib/config/env";

import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  ACCESS_TOKEN_TTL,
  AUTH_ROLES,
  type AccessTokenInput,
  type AccessTokenPayload,
} from "./types";

const ACCESS_TOKEN_ALGORITHM = "HS256";

const accessTokenSubjectSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .refine((value) => {
    const userId = Number(value);
    return Number.isSafeInteger(userId) && userId > 0;
  });

const accessTokenSchema = z.object({
  sub: accessTokenSubjectSchema,
  sid: z.uuid(),
  role: z.enum(AUTH_ROLES),
  type: z.literal("access"),
  iat: z.number().int(),
  exp: z.number().int(),
});

function getAccessTokenSecret(): Uint8Array {
  return new TextEncoder().encode(env.AUTH_ACCESS_TOKEN_SECRET);
}

export async function createAccessToken(
  payload: AccessTokenInput,
): Promise<string> {
  return new SignJWT({
    sid: payload.sid,
    role: payload.role,
    type: "access",
  })
    .setProtectedHeader({ alg: ACCESS_TOKEN_ALGORITHM, typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(ACCESS_TOKEN_ISSUER)
    .setAudience(ACCESS_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getAccessTokenSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getAccessTokenSecret(), {
    algorithms: [ACCESS_TOKEN_ALGORITHM],
    issuer: ACCESS_TOKEN_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
  });

  return accessTokenSchema.parse(payload);
}
