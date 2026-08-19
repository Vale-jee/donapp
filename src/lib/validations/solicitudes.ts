import { z } from "zod";

import { EstadoSolicitud } from "@/generated/prisma/client";

const CANONICAL_POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

const canonicalPositiveIntegerSchema = z
  .string()
  .regex(
    CANONICAL_POSITIVE_INTEGER_PATTERN,
    "Debe ser un entero positivo en formato canónico.",
  )
  .transform(Number)
  .refine(Number.isSafeInteger, "Debe ser un entero positivo válido.");

export const createRequestSchema = z.strictObject({
  donacionId: z
    .number()
    .int("La donación debe ser un identificador entero.")
    .positive("La donación debe ser un identificador positivo."),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const requestIdQuerySchema = z.strictObject({
  id: canonicalPositiveIntegerSchema,
});

export const requestActionSchema = z.strictObject({});

export const listRequestsQuerySchema = z.strictObject({
  page: canonicalPositiveIntegerSchema.optional().transform((value) => value ?? 1),
  limit: canonicalPositiveIntegerSchema
    .optional()
    .transform((value) => value ?? 20)
    .refine((value) => value <= 100, "El límite máximo es 100."),
  estado: z.enum(EstadoSolicitud).optional(),
});

export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;
