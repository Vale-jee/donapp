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

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_ISSUER = "donapp";
export const ACCESS_TOKEN_AUDIENCE = "donapp-api";
