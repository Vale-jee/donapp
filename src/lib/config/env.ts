import { z } from "zod";

const ACCESS_TOKEN_TTL_PATTERN = /^([1-9]\d*)([smhd])$/u;
const ACCESS_TOKEN_TTL_MAX_SECONDS = 24 * 60 * 60;
const ACCESS_TOKEN_TTL_SECONDS_BY_UNIT = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;

const accessTokenTtlSchema = z
  .string()
  .regex(
    ACCESS_TOKEN_TTL_PATTERN,
    "AUTH_ACCESS_TOKEN_TTL debe ser un entero positivo seguido de s, m, h o d.",
  )
  .refine((value) => {
    const match = ACCESS_TOKEN_TTL_PATTERN.exec(value);

    if (match === null) {
      return false;
    }

    const amount = Number(match[1]);
    const unit = match[2] as keyof typeof ACCESS_TOKEN_TTL_SECONDS_BY_UNIT;

    return (
      Number.isSafeInteger(amount) &&
      amount * ACCESS_TOKEN_TTL_SECONDS_BY_UNIT[unit] <= ACCESS_TOKEN_TTL_MAX_SECONDS
    );
  }, "AUTH_ACCESS_TOKEN_TTL no puede superar 24 horas.")
  .default("15m");

const redisUrlSchema = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "redis:" || protocol === "rediss:";
}, "REDIS_URL debe utilizar el protocolo redis o rediss.");

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  AUTH_ACCESS_TOKEN_SECRET: z.string().trim().min(32),
  AUTH_ACCESS_TOKEN_TTL: accessTokenTtlSchema,
  REDIS_URL: redisUrlSchema,
});

const parsedEnv = serverEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidVariables = [
    ...new Set(parsedEnv.error.issues.map((issue) => String(issue.path[0]))),
  ];

  throw new Error(
    `Variables de entorno inválidas: ${invalidVariables.join(", ")}`,
  );
}

export const env = parsedEnv.data;
