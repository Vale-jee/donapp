import { env } from "@/src/lib/config/env";

export const AUTH_ROLES = ["ADMIN", "USUARIO"] as const;

export type Role = (typeof AUTH_ROLES)[number];

export interface AccessTokenInput {
  sub: string;
  sid: string;
  role: Role;
}

export interface AccessTokenPayload extends AccessTokenInput {
  type: "access";
  iat: number;
  exp: number;
}

const ACCESS_TOKEN_TTL_PATTERN = /^([1-9]\d*)([smhd])$/u;
const ACCESS_TOKEN_TTL_SECONDS_BY_UNIT = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;

function accessTokenTtlToSeconds(value: string): number {
  const match = ACCESS_TOKEN_TTL_PATTERN.exec(value);

  if (match === null) {
    throw new Error("AUTH_ACCESS_TOKEN_TTL no tiene un formato válido.");
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof ACCESS_TOKEN_TTL_SECONDS_BY_UNIT;

  return amount * ACCESS_TOKEN_TTL_SECONDS_BY_UNIT[unit];
}

export const ACCESS_TOKEN_TTL = env.AUTH_ACCESS_TOKEN_TTL;
export const ACCESS_TOKEN_TTL_SECONDS = accessTokenTtlToSeconds(ACCESS_TOKEN_TTL);
export const REFRESH_TOKEN_TTL_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_ISSUER = "donapp";
export const ACCESS_TOKEN_AUDIENCE = "donapp-api";
