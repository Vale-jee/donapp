import { truncates } from "bcryptjs";
import { z } from "zod";

const collapseSpaces = (value: string): string =>
  value.trim().replace(/\s+/gu, " ");

const normalizeNullableString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim();
  return normalizedValue === "" ? null : normalizedValue;
};

const profilePictureSchema = z
  .string()
  .max(500, "La foto de perfil no puede superar 500 caracteres.")
  .refine((value) => {
    if (value.startsWith("/")) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "La foto de perfil debe ser una URL HTTP/HTTPS o una ruta relativa.");

const currentPasswordSchema = z
  .string("La contraseña actual debe ser una cadena de texto.")
  .min(1, "La contraseña actual es obligatoria.")
  .refine(
    (password) => !truncates(password),
    "La contraseña actual no puede superar los 72 bytes permitidos por bcrypt.",
  );

const newPasswordSchema = z
  .string("La nueva contraseña debe ser una cadena de texto.")
  .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
  .regex(/\p{L}/u, "La nueva contraseña debe incluir al menos una letra.")
  .regex(/\p{N}/u, "La nueva contraseña debe incluir al menos un número.")
  .refine(
    (password) => !truncates(password),
    "La nueva contraseña no puede superar los 72 bytes permitidos por bcrypt.",
  );

const canonicalPositiveIntegerSchema = z
  .string()
  .regex(/^[1-9]\d*$/u, "El identificador debe ser un entero positivo.")
  .transform(Number)
  .refine(Number.isSafeInteger, "El identificador debe ser un entero positivo.");

export const publicProfileQuerySchema = z.strictObject({
  id: canonicalPositiveIntegerSchema,
});

export const changePasswordSchema = z.strictObject({
  passwordActual: currentPasswordSchema,
  passwordNueva: newPasswordSchema,
});

export const deactivateAccountSchema = z.strictObject({
  passwordActual: currentPasswordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeactivateAccountInput = z.infer<typeof deactivateAccountSchema>;

export const updateProfileSchema = z
  .strictObject({
    nombreCompleto: z
      .string("El nombre completo debe ser una cadena de texto.")
      .transform(collapseSpaces)
      .pipe(
        z
          .string()
          .min(1, "El nombre completo no puede estar vacío.")
          .max(100, "El nombre completo no puede superar 100 caracteres."),
      )
      .optional(),
    nombreVisible: z
      .string("El nombre visible debe ser una cadena de texto.")
      .trim()
      .toLowerCase()
      .min(3, "El nombre visible debe tener al menos 3 caracteres.")
      .max(30, "El nombre visible no puede superar 30 caracteres.")
      .regex(
        /^[\p{L}\p{N}._]+$/u,
        "El nombre visible solo puede contener letras minúsculas, números, punto y guion bajo.",
      )
      .optional(),
    email: z
      .string("El correo electrónico debe ser una cadena de texto.")
      .trim()
      .toLowerCase()
      .max(254, "El correo electrónico no puede superar 254 caracteres.")
      .email("El correo electrónico no es válido.")
      .optional(),
    passwordActual: currentPasswordSchema.optional(),
    ciudad: z
      .string("La ciudad debe ser una cadena de texto.")
      .transform(collapseSpaces)
      .pipe(
        z
          .string()
          .min(1, "La ciudad no puede estar vacía.")
          .max(100, "La ciudad no puede superar 100 caracteres."),
      )
      .optional(),
    telefono: z.preprocess(
      normalizeNullableString,
      z
        .string()
        .regex(
          /^\+?\d{7,15}$/,
          "El teléfono debe contener entre 7 y 15 dígitos y solo puede incluir un + inicial.",
        )
        .nullable()
        .optional(),
    ),
    fotoPerfil: z.preprocess(
      normalizeNullableString,
      profilePictureSchema.nullable().optional(),
    ),
  })
  .superRefine((input, context) => {
    const hasProfileChange =
      input.nombreCompleto !== undefined ||
      input.nombreVisible !== undefined ||
      input.email !== undefined ||
      input.ciudad !== undefined ||
      input.telefono !== undefined ||
      input.fotoPerfil !== undefined;

    if (!hasProfileChange) {
      context.addIssue({
        code: "custom",
        message: "Debe enviar al menos un campo modificable.",
        path: [],
      });
    }

    if (input.email !== undefined && input.passwordActual === undefined) {
      context.addIssue({
        code: "custom",
        message: "La contraseña actual es obligatoria para cambiar el correo electrónico.",
        path: ["passwordActual"],
      });
    }
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
