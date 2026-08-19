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

export const chatIdQuerySchema = z.strictObject({
  id: canonicalPositiveIntegerSchema,
});

export const createChatSchema = z.strictObject({});

export const chatPaginationSchema = z.strictObject({
  page: canonicalPositiveIntegerSchema.optional().transform((value) => value ?? 1),
  limit: canonicalPositiveIntegerSchema
    .optional()
    .transform((value) => value ?? 20)
    .refine((value) => value <= 100, "El límite máximo es 100."),
});

export type ChatPagination = z.infer<typeof chatPaginationSchema>;

export const chatMessagesQuerySchema = z.strictObject({
  id: canonicalPositiveIntegerSchema,
  page: canonicalPositiveIntegerSchema.optional().transform((value) => value ?? 1),
  limit: canonicalPositiveIntegerSchema
    .optional()
    .transform((value) => value ?? 20)
    .refine((value) => value <= 100, "El límite máximo es 100."),
});

export const sendMessageSchema = z.strictObject({
  contenido: z
    .string()
    .trim()
    .min(1, "El contenido no puede estar vacío.")
    .max(1000, "El contenido no puede superar 1000 caracteres."),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
