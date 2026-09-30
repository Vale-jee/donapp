import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EstadoDonacion } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  list: vi.fn(), count: vi.fn(), donation: vi.fn(), user: vi.fn(), rating: vi.fn(),
  auth: vi.fn(), transaction: vi.fn(),
}));
vi.mock("@/src/middleware/auth", () => ({ requireAuth: mocks.auth }));
vi.mock("@/database/client", () => ({ prisma: {
  $transaction: mocks.transaction,
  donacion: { findMany: mocks.list, count: mocks.count, findUnique: mocks.donation, findFirst: mocks.rating },
  usuario: { findUnique: mocks.user },
} }));

// Real handlers, validation, service and database query builder; only the
// authenticated session and Prisma transport are replaced by controlled data.
import ownHandler from "@/src/pages/api/donaciones/mias";
import detailHandler from "@/src/pages/api/donaciones/[id]/index";

function responseMock() {
  const response = { statusCode: 200, body: undefined as unknown,
    status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  response.status.mockImplementation((status: number) => { response.statusCode = status; return response; });
  response.json.mockImplementation((body: unknown) => { response.body = body; return response; });
  return response;
}
const record = {
  id: 731, propietarioId: 9, titulo: "Mesa de prueba", descripcion: "Mesa de prueba en buen estado.",
  ciudad: "Bogotá", estado: EstadoDonacion.PUBLICADA,
  createdAt: new Date("2026-09-01T12:00:00Z"), updatedAt: new Date("2026-09-01T12:00:00Z"),
  categoria: { id: 1, nombre: "Muebles" }, imagenes: [], _count: { imagenes: 0 },
  solicitudes: [], solicitudAceptada: null,
};

describe("Mis donaciones → GET detalle conserva el ID del servidor", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ userId: 9 });
    mocks.transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries));
    mocks.list.mockResolvedValue([record]);
    mocks.count.mockResolvedValue(1);
    // Owner remains allowed even when their current profile city differs.
    mocks.user.mockResolvedValue({ id: 9, ciudad: "Medellín" });
    mocks.rating.mockResolvedValue(null);
    mocks.donation.mockImplementation(({ where }: { where: { id: number } }) =>
      Promise.resolve(where.id === record.id ? record : null));
  });

  it("/mias devuelve 731 y el handler consulta Prisma por 731, con GET 200", async () => {
    const listResponse = responseMock();
    await ownHandler({ method: "GET", query: {} } as unknown as NextApiRequest,
      listResponse as unknown as NextApiResponse);
    expect(listResponse.statusCode).toBe(200);
    const body = listResponse.body as { data: { donaciones: { id: number }[] } };
    const id = body.data.donaciones[0].id;
    expect(id).toBe(731);
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ where: { propietarioId: 9 } }));

    const response = responseMock();
    await detailHandler({ method: "GET", query: { id: String(id) } } as unknown as NextApiRequest,
      response as unknown as NextApiResponse);
    expect(mocks.donation).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 731 } }));
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { donacion: { id: 731, puedeSolicitar: false } } });
  });

  it("un registro inexistente devuelve el 404 JSON de negocio", async () => {
    const response = responseMock();
    await detailHandler({ method: "GET", query: { id: "732" } } as unknown as NextApiRequest,
      response as unknown as NextApiResponse);
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchObject({ success: false, status: 404, message: "Donación no encontrada.", data: null });
  });
});
