import { describe, expect, it } from "vitest";

import { loginSchema, refreshSchema, registerSchema } from "@/src/lib/validations/auth";
import { createDonationSchema } from "@/src/lib/validations/donaciones";

describe("validaciones críticas", () => {
  it("normaliza identidad de registro sin alterar la contraseña", () => {
    const result = registerSchema.parse({
      nombreCompleto: "  Ana   Pérez  ", nombreVisible: "  Ana.Test ",
      email: " ANA@EXAMPLE.COM ", password: " clave 123 ", ciudad: " Bogotá  D.C. ",
      telefono: "", fotoPerfil: "",
    });
    expect(result).toMatchObject({
      nombreCompleto: "Ana Pérez", nombreVisible: "ana.test",
      email: "ana@example.com", password: " clave 123 ", ciudad: "Bogotá D.C.",
      telefono: null, fotoPerfil: null,
    });
  });

  it("rechaza campos desconocidos y contraseñas que bcrypt truncaría", () => {
    expect(() => loginSchema.parse({ email: "a@b.co", password: "x".repeat(73), extra: true })).toThrow();
  });

  it("exige refresh token Base64URL de longitud exacta", () => {
    expect(refreshSchema.safeParse({ refreshToken: "a".repeat(43) }).success).toBe(true);
    expect(refreshSchema.safeParse({ refreshToken: `${"a".repeat(42)}+` }).success).toBe(false);
  });

  it("normaliza títulos y bloquea contenido enriquecido e imágenes repetidas", () => {
    const valid = createDonationSchema.parse({
      titulo: "  Mesa   auxiliar ", descripcion: "Descripción suficientemente larga y segura.",
      categoriaId: 1, imagenes: ["/tests/mesa.jpg"],
    });
    expect(valid.titulo).toBe("Mesa auxiliar");
    expect(createDonationSchema.safeParse({ ...valid, descripcion: "Descripción con <script>alert(1)</script>" }).success).toBe(false);
    expect(createDonationSchema.safeParse({ ...valid, imagenes: ["/a.jpg", "/a.jpg"] }).success).toBe(false);
  });
});
