import { z } from "zod";

const CANONICAL_POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

const canonicalPositiveIntegerSchema = z
  .string()
  .regex(
    CANONICAL_POSITIVE_INTEGER_PATTERN,
    "Debe ser un entero positivo en formato canónico.",
  )
  .transform(Number)
  .refine(Number.isSafeInteger, "Debe ser un entero positivo válido.");

export const ratingIdQuerySchema = z.strictObject({
  id: canonicalPositiveIntegerSchema,
});

export const createRatingSchema = z.strictObject({
  puntuacion: z
    .number()
    .int("La puntuación debe ser un número entero.")
    .min(1, "La puntuación mínima es 1.")
    .max(5, "La puntuación máxima es 5."),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

export const ratingsPaginationSchema = z.strictObject({
  page: canonicalPositiveIntegerSchema.optional().transform((value) => value ?? 1),
  limit: canonicalPositiveIntegerSchema
    .optional()
    .transform((value) => value ?? 20)
    .refine((value) => value <= 100, "El límite máximo es 100."),
});

export type RatingsPagination = z.infer<typeof ratingsPaginationSchema>;

export const userRatingsQuerySchema = z.strictObject({
  id: canonicalPositiveIntegerSchema,
  page: canonicalPositiveIntegerSchema.optional().transform((value) => value ?? 1),
  limit: canonicalPositiveIntegerSchema
    .optional()
    .transform((value) => value ?? 20)
    .refine((value) => value <= 100, "El límite máximo es 100."),
});
