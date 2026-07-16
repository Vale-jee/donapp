import { createHash, randomBytes } from "node:crypto";

import { REFRESH_TOKEN_TTL_MILLISECONDS } from "./types";

const REFRESH_TOKEN_BYTES = 32;

export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getRefreshTokenExpirationDate(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MILLISECONDS);
}
