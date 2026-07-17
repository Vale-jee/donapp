import { truncates } from "bcryptjs";
import { z } from "zod";

const collapseSpaces = (value: string): string =>
  value.trim().replace(/\s+/gu, " ");

const optionalNullableString = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
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

export const registerSchema = z
  .strictObject({
    nombreCompleto: z
      .string("El nombre completo es obligatorio.")
      .transform(collapseSpaces)
      .pipe(
        z
          .string()
          .min(1, "El nombre completo es obligatorio.")
          .max(100, "El nombre completo no puede superar 100 caracteres."),
      ),
    nombreVisible: z
      .string("El nombre visible es obligatorio.")
      .trim()
      .toLowerCase()
      .min(3, "El nombre visible debe tener al menos 3 caracteres.")
      .max(30, "El nombre visible no puede superar 30 caracteres.")
      .regex(
        /^[\p{L}\p{N}._]+$/u,
        "El nombre visible solo puede contener letras, números, punto y guion bajo.",
      ),
    email: z
      .string("El correo electrónico es obligatorio.")
      .trim()
      .toLowerCase()
      .max(254, "El correo electrónico no puede superar 254 caracteres.")
      .email("El correo electrónico no es válido."),
    password: z
      .string("La contraseña es obligatoria.")
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .regex(/\p{L}/u, "La contraseña debe incluir al menos una letra.")
      .regex(/\p{N}/u, "La contraseña debe incluir al menos un número.")
      .refine(
        (password) => !truncates(password),
        "La contraseña no puede superar los 72 bytes permitidos por bcrypt.",
      ),
    ciudad: z
      .string("La ciudad es obligatoria.")
      .transform(collapseSpaces)
      .pipe(
        z
          .string()
          .min(1, "La ciudad es obligatoria.")
          .max(100, "La ciudad no puede superar 100 caracteres."),
      ),
    telefono: z.preprocess(
      optionalNullableString,
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
      optionalNullableString,
      profilePictureSchema.nullable().optional(),
    ),
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.strictObject({
  email: z
    .string("El correo electrónico es obligatorio.")
    .trim()
    .toLowerCase()
    .max(254, "El correo electrónico no puede superar 254 caracteres.")
    .email("El correo electrónico no es válido."),
  password: z
    .string("La contraseña es obligatoria.")
    .min(1, "La contraseña es obligatoria.")
    .refine(
      (password) => !truncates(password),
      "La contraseña no puede superar los 72 bytes permitidos por bcrypt.",
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.strictObject({
  refreshToken: z
    .string("El refresh token es obligatorio.")
    .length(43, "El refresh token debe tener exactamente 43 caracteres.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "El refresh token debe tener un formato Base64URL válido.",
    ),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const logoutSchema = refreshSchema;

export type LogoutInput = z.infer<typeof logoutSchema>;
