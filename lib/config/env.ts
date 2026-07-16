import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  AUTH_ACCESS_TOKEN_SECRET: z.string().trim().min(32),
});

const parsedEnv = serverEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidVariables = [
    ...new Set(
      parsedEnv.error.issues.map((issue) => String(issue.path[0])),
    ),
  ];

  throw new Error(
    `Variables de entorno inválidas: ${invalidVariables.join(", ")}`,
  );
}

export const env = parsedEnv.data;
