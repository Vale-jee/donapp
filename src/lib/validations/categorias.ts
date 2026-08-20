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

const categoryNameSchema = z
  .string("El nombre es obligatorio.")
  .transform(collapseSpaces)
  .pipe(
    z
      .string()
      .min(3, "El nombre debe tener al menos 3 caracteres.")
      .max(80, "El nombre no puede superar 80 caracteres."),
  );

const canonicalPositiveIntegerSchema = z
  .string()
  .regex(/^[1-9]\d*$/u, "El identificador debe ser un entero positivo.")
  .transform(Number)
  .refine(Number.isSafeInteger, "El identificador debe ser un entero positivo.");

export const categoryIdQuerySchema = z.strictObject({
  id: canonicalPositiveIntegerSchema,
});

export const createCategorySchema = z.strictObject({
  nombre: categoryNameSchema,
  descripcion: categoryDescriptionSchema.nullable().optional(),
});

export const updateCategorySchema = z
  .strictObject({
    nombre: categoryNameSchema.optional(),
    descripcion: categoryDescriptionSchema.nullable().optional(),
  })
  .refine(
    (input) => input.nombre !== undefined || input.descripcion !== undefined,
    "Debe enviar al menos un campo modificable.",
  );

export const updateCategoryStateSchema = z.strictObject({
  activo: z.boolean("El estado activo debe ser verdadero o falso."),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateCategoryStateInput = z.infer<
  typeof updateCategoryStateSchema
>;
