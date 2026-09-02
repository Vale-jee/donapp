import { EstadoDonacion, Prisma } from "@/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/database/client", () => ({
  prisma: {
    $transaction: mocks.transaction,
    donacion: { findUnique: mocks.findUnique },
  },
}));

const clientId = "550e8400-e29b-41d4-a716-446655440000";
const input = {
  clientId,
  titulo: "Mesa para donar",
  descripcion: "Mesa de madera en buen estado para donar.",
  categoriaId: 4,
  imagenes: ["https://images.test/mesa.jpg"],
};
const donation = {
  id: 42,
  clientId,
  titulo: input.titulo,
  descripcion: input.descripcion,
  ciudad: "Bogotá",
  estado: EstadoDonacion.PUBLICADA,
  createdAt: new Date("2026-09-02T20:00:00.000Z"),
  updatedAt: new Date("2026-09-02T20:00:00.000Z"),
  categoria: { id: 4, nombre: "Muebles" },
  imagenes: [
    { id: 9, referencia: "https://images.test/mesa.jpg", orden: 1 },
  ],
};

describe("idempotencia de creación de donaciones", () => {
  beforeEach(() => vi.clearAllMocks());

  it("un POST lógico repetido devuelve la misma entidad sin crear otra", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        usuario: {
          findUnique: vi.fn().mockResolvedValue({ id: 7, ciudad: "Bogotá" }),
        },
        categoria: {
          findUnique: vi.fn().mockResolvedValue({ id: 4, activo: true }),
        },
        donacion: { findUnique: mocks.findUnique, create: mocks.create },
      }),
    );
    mocks.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(donation);
    mocks.create.mockResolvedValue(donation);
    const { createDonation } = await import(
      "@/src/lib/services/donacion-service"
    );

    const first = await createDonation(7, input);
    const second = await createDonation(7, input);

    expect(first.id).toBe(42);
    expect(second.id).toBe(42);
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { propietarioId_clientId: { propietarioId: 7, clientId } },
      }),
    );
  });

  it("el mismo clientId queda aislado por propietario", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        usuario: {
          findUnique: vi.fn(({ where }) =>
            Promise.resolve({ id: where.id, ciudad: "Bogotá" }),
          ),
        },
        categoria: {
          findUnique: vi.fn().mockResolvedValue({ id: 4, activo: true }),
        },
        donacion: { findUnique: vi.fn().mockResolvedValue(null), create: mocks.create },
      }),
    );
    mocks.create
      .mockResolvedValueOnce(donation)
      .mockResolvedValueOnce({ ...donation, id: 43 });
    const { createDonation } = await import(
      "@/src/lib/services/donacion-service"
    );
    expect((await createDonation(7, input)).id).toBe(42);
    expect((await createDonation(8, input)).id).toBe(43);
    expect(mocks.create).toHaveBeenCalledTimes(2);
  });

  it("una carrera por la restricción única recupera la fila ganadora", async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7.8.0",
      }),
    );
    mocks.findUnique.mockResolvedValue(donation);
    const { createDonation } = await import(
      "@/src/lib/services/donacion-service"
    );

    await expect(createDonation(7, input)).resolves.toMatchObject({ id: 42 });
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { propietarioId_clientId: { propietarioId: 7, clientId } },
      }),
    );
  });
});
