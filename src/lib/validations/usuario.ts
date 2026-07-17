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
    passwordActual: z
      .string("La contraseña actual debe ser una cadena de texto.")
      .min(1, "La contraseña actual es obligatoria.")
      .refine(
        (password) => !truncates(password),
        "La contraseña actual no puede superar los 72 bytes permitidos por bcrypt.",
      )
      .optional(),
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
