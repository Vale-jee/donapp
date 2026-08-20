import { createHash } from "node:crypto";

import Redis from "ioredis";
import type { NextApiRequest, NextApiResponse } from "next";

import { ApiError } from "@/src/lib/api/errors";
import { env } from "@/src/lib/config/env";

const RATE_LIMIT_MESSAGE = "Demasiadas solicitudes. Intente nuevamente más tarde.";
const RATE_LIMIT_KEY_PREFIX = "donapp:security:rate-limit";
const REDIS_READY_TIMEOUT_MILLISECONDS = 3_000;

const FIXED_WINDOW_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

interface RateLimitPolicy {
  name: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  current: number;
  remaining: number;
  resetSeconds: number;
}

const globalForRateLimit = globalThis as typeof globalThis & {
  donappRateLimitRedis?: Redis;
  donappRateLimitRedisReady?: Promise<void>;
  donappRateLimitRedisReadyClient?: Redis;
};

function createRateLimitRedis(): Redis {
  const redis = new Redis(env.REDIS_URL, {
      connectionName: "donapp-rate-limit",
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      lazyConnect: true,
  });
  redis.on("error", () => undefined);
  return redis;
}

function getRateLimitRedis(): Redis {
  const existing = globalForRateLimit.donappRateLimitRedis;

  if (existing === undefined || existing.status === "end") {
    const redis = createRateLimitRedis();
    globalForRateLimit.donappRateLimitRedis = redis;
    return redis;
  }

  return existing;
}

function waitForRedisReady(redis: Redis): Promise<void> {
  if (redis.status === "ready") {
    return Promise.resolve();
  }

  if (redis.status === "wait") {
    return redis.connect();
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Redis no estuvo disponible dentro del tiempo esperado."));
    }, REDIS_READY_TIMEOUT_MILLISECONDS);

    const onReady = () => {
      cleanup();
      resolve();
    };
    const onEnd = () => {
      cleanup();
      reject(new Error("La conexión de Redis finalizó antes de estar lista."));
    };
    const cleanup = () => {
      clearTimeout(timeout);
      redis.off("ready", onReady);
      redis.off("end", onEnd);
    };

    redis.once("ready", onReady);
    redis.once("end", onEnd);
  });
}

async function getReadyRateLimitRedis(): Promise<Redis> {
  const redis = getRateLimitRedis();

  if (redis.status !== "ready") {
    if (
      globalForRateLimit.donappRateLimitRedisReady === undefined ||
      globalForRateLimit.donappRateLimitRedisReadyClient !== redis
    ) {
      globalForRateLimit.donappRateLimitRedisReadyClient = redis;
      globalForRateLimit.donappRateLimitRedisReady = waitForRedisReady(redis)
        .finally(() => {
          if (globalForRateLimit.donappRateLimitRedisReadyClient === redis) {
            globalForRateLimit.donappRateLimitRedisReady = undefined;
            globalForRateLimit.donappRateLimitRedisReadyClient = undefined;
          }
        });
    }
    await globalForRateLimit.donappRateLimitRedisReady;
  }

  if (redis.status !== "ready") {
    throw new Error("Redis no se encuentra listo.");
  }

  return redis;
}

function hashIdentifier(identifier: string): string {
  return createHash("sha256").update(identifier, "utf8").digest("hex");
}

function getClientIp(request: NextApiRequest): string {
  const remoteAddress = request.socket?.remoteAddress?.trim().toLowerCase();

  if (remoteAddress) {
    return remoteAddress;
  }

  const forwardedFor = request.headers["x-forwarded-for"];
  const serializedForwardedFor = Array.isArray(forwardedFor)
    ? forwardedFor.join(",")
    : forwardedFor;
  const lastProxyAddress = serializedForwardedFor
    ?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .at(-1);

  return lastProxyAddress || "unknown";
}

async function incrementFixedWindow(
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const redis = await getReadyRateLimitRedis();
  const result = await redis.eval(
    FIXED_WINDOW_SCRIPT,
    1,
    key,
    String(policy.windowMs),
  );

  if (!Array.isArray(result) || result.length !== 2) {
    throw new Error("Respuesta inesperada del almacenamiento de rate limiting.");
  }

  const current = Number(result[0]);
  const ttlMs = Math.max(Number(result[1]), 0);

  if (!Number.isSafeInteger(current) || !Number.isFinite(ttlMs)) {
    throw new Error("Estado inválido del rate limiting.");
  }

  return {
    current,
    remaining: Math.max(policy.limit - current, 0),
    resetSeconds: Math.max(Math.ceil(ttlMs / 1000), 1),
  };
}

function setRateLimitHeaders(
  response: NextApiResponse,
  policy: RateLimitPolicy,
  result: RateLimitResult,
): void {
  response.setHeader("RateLimit-Limit", String(policy.limit));
  response.setHeader("RateLimit-Remaining", String(result.remaining));
  response.setHeader("RateLimit-Reset", String(result.resetSeconds));
}

async function applyPolicy(
  identifier: string,
  policy: RateLimitPolicy,
  response?: NextApiResponse,
): Promise<RateLimitResult> {
  const key = `${RATE_LIMIT_KEY_PREFIX}:${policy.name}:${hashIdentifier(identifier)}`;
  const result = await incrementFixedWindow(key, policy);

  if (response !== undefined) {
    setRateLimitHeaders(response, policy, result);
  }

  if (result.current > policy.limit) {
    response?.setHeader("Retry-After", String(result.resetSeconds));
    throw new ApiError(429, RATE_LIMIT_MESSAGE, "rate_limit");
  }

  return result;
}

export const AUTH_RATE_LIMIT_POLICIES = {
  login: { name: "auth-login-ip", limit: 20, windowMs: 15 * 60 * 1000 },
  register: { name: "auth-register-ip", limit: 10, windowMs: 60 * 60 * 1000 },
  refresh: { name: "auth-refresh-ip", limit: 60, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, RateLimitPolicy>;

const LOGIN_FAILURE_POLICY = {
  name: "auth-login-email-failure",
  limit: 5,
  windowMs: 15 * 60 * 1000,
} as const satisfies RateLimitPolicy;

export function createIpRateLimit(
  policy: RateLimitPolicy,
): (request: NextApiRequest, response: NextApiResponse) => Promise<void> {
  return async (request, response) => {
    if (request.method !== "POST") {
      return;
    }

    await applyPolicy(getClientIp(request), policy, response);
  };
}

export async function assertLoginEmailNotBlocked(
  email: string,
  response: NextApiResponse,
): Promise<void> {
  const key = `${RATE_LIMIT_KEY_PREFIX}:${LOGIN_FAILURE_POLICY.name}:${hashIdentifier(email)}`;
  const redis = await getReadyRateLimitRedis();

  const attempts = Number(await redis.get(key));

  if (Number.isFinite(attempts) && attempts >= LOGIN_FAILURE_POLICY.limit) {
    const ttlMs = Math.max(await redis.pttl(key), 1_000);
    const result = {
      current: attempts,
      remaining: 0,
      resetSeconds: Math.ceil(ttlMs / 1000),
    };
    setRateLimitHeaders(response, LOGIN_FAILURE_POLICY, result);
    response.setHeader("Retry-After", String(result.resetSeconds));
    throw new ApiError(429, RATE_LIMIT_MESSAGE, "rate_limit");
  }
}

export async function recordLoginFailure(
  email: string,
  response: NextApiResponse,
): Promise<void> {
  await applyPolicy(email, LOGIN_FAILURE_POLICY, response);
}

export async function clearLoginFailures(email: string): Promise<void> {
  const key = `${RATE_LIMIT_KEY_PREFIX}:${LOGIN_FAILURE_POLICY.name}:${hashIdentifier(email)}`;
  const redis = await getReadyRateLimitRedis();

  await redis.del(key);
}
