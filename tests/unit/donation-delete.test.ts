import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EstadoDonacion, EstadoSolicitud, Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/src/lib/api/errors";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), lock: vi.fn(), find: vi.fn(), audit: vi.fn(),
  images: vi.fn(), remove: vi.fn(), auth: vi.fn(),
}));
vi.mock("@/database/client", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/src/middleware/auth", () => ({ requireAuth: mocks.auth }));
import { deleteDonation } from "@/src/lib/services/donacion-service";
import handler from "@/src/pages/api/donaciones/[id]/index";

const eligible = {
  propietarioId: 7, estado: EstadoDonacion.PUBLICADA, solicitudAceptadaId: null,
  solicitudes: [], calificacion: null, exencionCalificacion: null,
};

function responseMock() {
  const response = { statusCode: 200, body: undefined as unknown,
    status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  response.status.mockImplementation((status: number) => { response.statusCode = status; return response; });
  response.json.mockImplementation((body: unknown) => { response.body = body; return response; });
  return response;
}
async function request(id = "42", method = "DELETE") {
  const response = responseMock();
  await handler({ method, query: { id } } as unknown as NextApiRequest, response as unknown as NextApiResponse);
  return response;
}

describe("DELETE donación", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ userId: 7 });
    mocks.find.mockResolvedValue(eligible);
    mocks.audit.mockResolvedValue(null);
    mocks.remove.mockResolvedValue({ id: 42 });
    mocks.transaction.mockImplementation(async (callback) => callback({
      $queryRaw: mocks.lock,
      donacion: { findUnique: mocks.find, delete: mocks.remove },
      auditoriaAdministrativa: { findFirst: mocks.audit },
      imagenDonacion: { deleteMany: mocks.images },
      // No historical mutation delegates: any accidental access fails the test.
    }));
  });

  it("propietario elimina imágenes y donación en una misma transacción y responde 200", async () => {
    const response = await request();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ success: true, message: "Donación eliminada correctamente.", data: { id: 42 } });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.find.mock.invocationCallOrder[0]);
    expect(mocks.images).toHaveBeenCalledWith({ where: { donacionId: 42 } });
    expect(mocks.remove).toHaveBeenCalledWith({ where: { id: 42 }, select: { id: true } });
    expect(mocks.images.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
  });

  for (const [label, donation] of [["inexistente", null], ["ajena", { ...eligible, propietarioId: 8 }]] as const) {
    it(`${label}: 404 sin eliminar`, async () => {
      mocks.find.mockResolvedValue(donation);
      expect((await request()).statusCode).toBe(404);
      expect(mocks.images).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });
  }
  it("sin autenticar: 401 antes de acceder a BD", async () => {
    mocks.auth.mockRejectedValue(new ApiError(401, "Access token inválido."));
    expect((await request()).statusCode).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  for (const id of ["0", "-1", "abc", "1.5", "01", "2147483648"]) {
    it(`id inválido ${id}: 400`, async () => {
      expect((await request(id)).statusCode).toBe(400);
      expect(mocks.transaction).not.toHaveBeenCalled();
    });
  }
  for (const estado of [EstadoDonacion.RESERVADA, EstadoDonacion.ENTREGADA, EstadoDonacion.RETIRADA]) {
    it(`${estado}: 409 sin eliminar`, async () => {
      mocks.find.mockResolvedValue({ ...eligible, estado });
      expect((await request()).statusCode).toBe(409);
      expect(mocks.images).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });
  }
  for (const estado of Object.values(EstadoSolicitud)) {
    it(`solicitud ${estado}: conserva donación, imágenes y todo su historial`, async () => {
      mocks.find.mockResolvedValue({ ...eligible, solicitudes: [{ id: 90, estado }] });
      const response = await request();
      expect(response.statusCode).toBe(409);
      expect(response.body).toMatchObject({ message: "Esta donación no se puede eliminar porque ya tiene solicitudes asociadas." });
      expect(mocks.images).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });
  }
  for (const relation of ["calificacion", "exencionCalificacion", "solicitudAceptadaId"]) {
    it(`${relation} bloquea una PUBLICADA sin solicitudes`, async () => {
      mocks.find.mockResolvedValue({ ...eligible, [relation]: relation === "solicitudAceptadaId" ? 90 : { id: 90 } });
      expect((await request()).statusCode).toBe(409);
      expect(mocks.images).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });
  }
  it("conserva referencias de auditoría administrativa", async () => {
    mocks.audit.mockResolvedValue({ id: 8 });
    expect((await request()).statusCode).toBe(409);
    expect(mocks.images).not.toHaveBeenCalled();
  });
  for (const code of ["P2003", "P2034"]) {
    it(`traduce ${code} a conflicto seguro`, async () => {
      mocks.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("SQL secreto", { code, clientVersion: "7.8.0" }));
      const response = await request();
      expect(response.statusCode).toBe(409);
      expect(JSON.stringify(response.body)).not.toContain("SQL secreto");
    });
  }
  it("sanitiza errores internos", async () => {
    mocks.remove.mockRejectedValue(new Error("SQL secreto"));
    const response = await request();
    expect(response.statusCode).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain("SQL secreto");
  });
  it("405 incluye DELETE en Allow", async () => {
    const response = await request("42", "PUT");
    expect(response.statusCode).toBe(405);
    expect(response.setHeader).toHaveBeenCalledWith("Allow", ["GET", "PATCH", "DELETE"]);
  });
  it("el servicio devuelve solo el identificador", async () => {
    await expect(deleteDonation(7, 42)).resolves.toEqual({ id: 42 });
  });
});
