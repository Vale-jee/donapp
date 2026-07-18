import { z } from "zod";

const CLEAR_HTML_TAG_PATTERN = /<\/?[a-z][^<>]*>/iu;
const FENCED_CODE_PATTERN = /```/u;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]\r\n]*\]\([^\r\n)]+\)/u;
const MARKDOWN_LINK_PATTERN = /(?<!!)\[[^\]\r\n]+\]\([^\r\n)]+\)/u;
const MARKDOWN_HEADING_PATTERN = /^\s{0,3}#{1,6}\s+\S/mu;
const MARKDOWN_QUOTE_PATTERN = /^\s{0,3}>\s+\S/mu;
const WHITESPACE_PATTERN = /\s/u;

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

function isPlainDescription(value: string): boolean {
  return !(
    CLEAR_HTML_TAG_PATTERN.test(value) ||
    FENCED_CODE_PATTERN.test(value) ||
    MARKDOWN_IMAGE_PATTERN.test(value) ||
    MARKDOWN_LINK_PATTERN.test(value) ||
    MARKDOWN_HEADING_PATTERN.test(value) ||
    MARKDOWN_QUOTE_PATTERN.test(value)
  );
}

function isValidImageReference(value: string): boolean {
  if (WHITESPACE_PATTERN.test(value)) {
    return false;
  }

  if (value.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const imageReferenceSchema = z
  .string()
  .trim()
  .min(1, "La referencia de imagen no puede estar vacía.")
  .max(500, "La referencia de imagen no puede superar 500 caracteres.")
  .refine(isValidImageReference, "La referencia de imagen no es válida.");

export const createDonationSchema = z.strictObject({
  titulo: z
    .string()
    .transform(normalizeTitle)
    .pipe(
      z
        .string()
        .min(5, "El título debe tener al menos 5 caracteres.")
        .max(100, "El título no puede superar 100 caracteres."),
    ),
  descripcion: z
    .string()
    .trim()
    .min(20, "La descripción debe tener al menos 20 caracteres.")
    .max(1000, "La descripción no puede superar 1000 caracteres.")
    .refine(
      isPlainDescription,
      "La descripción no puede contener HTML ni Markdown.",
    ),
  categoriaId: z
    .number()
    .int("La categoría debe ser un identificador entero.")
    .positive("La categoría debe ser un identificador positivo."),
  imagenes: z
    .array(imageReferenceSchema)
    .min(1, "Debe incluir al menos una imagen.")
    .max(5, "No puede incluir más de cinco imágenes.")
    .superRefine((imagenes, context) => {
      const references = new Set<string>();

      imagenes.forEach((reference, index) => {
        if (references.has(reference)) {
          context.addIssue({
            code: "custom",
            path: [index],
            message: "Las referencias de imagen no pueden repetirse.",
          });
        }

        references.add(reference);
      });
    }),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;
