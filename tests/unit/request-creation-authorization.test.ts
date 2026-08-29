import { EstadoDonacion } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

const transaction = {
  donacion: {
    findUnique: vi.fn().mockResolvedValue({
      id: 4,
      titulo: "Mesa",
      ciudad: "Bogotá",
      estado: EstadoDonacion.PUBLICADA,
      propietarioId: 1,
      imagenes: [],
    }),
    findFirst: vi.fn(),
  },
  solicitud: { findFirst: vi.fn(), create: vi.fn() },
};

vi.mock("@/database/client", () => ({
  prisma: {
    $transaction: vi.fn(
      async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  },
}));

import { createRequest } from "@/src/lib/services/solicitud-service";

describe("autorización definitiva al crear solicitudes", () => {
  it("POST vuelve a validar aunque un GET anterior pudiera haber permitido solicitar", async () => {
    await expect(createRequest(1, "Bogotá", { donacionId: 4 })).rejects.toMatchObject({
      status: 409,
      message: "No puede solicitar una donación propia.",
    });
    expect(transaction.solicitud.create).not.toHaveBeenCalled();
  });
});
