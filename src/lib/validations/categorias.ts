import { z } from "zod";

const collapseSpaces = (value: string): string =>
  value.trim().replace(/\s+/gu, " ");

const categoryDescriptionSchema = z
  .string()
  .transform(collapseSpaces)
  .transform((value) => (value === "" ? null : value))
  .pipe(
    z
      .string()
      .max(250, "La descripción no puede superar 250 caracteres.")
      .nullable(),
  );

export const createCategorySchema = z.strictObject({
  nombre: z
    .string("El nombre es obligatorio.")
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres.")
        .max(80, "El nombre no puede superar 80 caracteres."),
    ),
  descripcion: categoryDescriptionSchema.nullable().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
