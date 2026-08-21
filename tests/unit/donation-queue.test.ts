import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/middleware/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 7, city: "Bogotá" }),
}));
vi.mock("@/src/lib/services/donacion-service", () => ({
  createDonation: vi.fn().mockResolvedValue({
    id: 42,
    createdAt: new Date("2026-08-21T12:00:00.000Z"),
  }),
  listAvailableDonations: vi.fn(),
}));
function responseMock() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockImplementation((status: number) => {
    response.statusCode = status;
    return response;
  });
  response.json.mockImplementation((body: unknown) => {
    response.body = body;
    return response;
  });
  return response;
}

describe("robustez de la cola de donaciones", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@127.0.0.1:5432/donapp_test");
    vi.stubEnv("REDIS_URL", "redis://127.0.0.1:6379/15");
    vi.stubEnv("AUTH_ACCESS_TOKEN_SECRET", "test-secret-with-at-least-32-characters");
    vi.stubEnv("AUTH_ACCESS_TOKEN_TTL", "15m");
  });

  it("usa jobId estable y opciones acotadas de reintento y retención", async () => {
    vi.resetModules();
    const queue = await import("@/src/lib/queue/donation-queue");

    expect(queue.getDonationCreatedJobId(42)).toBe("donation-created-42");
    expect(queue.DONATION_CREATED_JOB_OPTIONS).toEqual({
      attempts: 5,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: { age: 86_400, count: 1_000 },
      removeOnFail: { age: 604_800, count: 5_000 },
    });
  });

  it("responde 201 y marca reconciliación pendiente si Redis falla después del commit", async () => {
    vi.resetModules();
    vi.doMock("@/src/lib/queue/donation-queue", () => {
      class DonationQueueUnavailableError extends Error {
        constructor() {
          super("queue unavailable");
          this.name = "DonationQueueUnavailableError";
        }
      }

      return {
        DONATION_CREATED_JOB_NAME: "donation-created",
        DonationQueueUnavailableError,
        enqueueDonationCreated: vi
          .fn()
          .mockRejectedValue(new DonationQueueUnavailableError()),
      };
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { default: handler } = await import("@/src/pages/api/donaciones/index");
    const request = {
      method: "POST",
      query: {},
      body: {
        titulo: "Mesa para donar",
        descripcion: "Mesa de madera en buen estado para donar.",
        categoriaId: 1,
        imagenes: ["/tests/mesa.jpg"],
      },
      headers: { "x-request-id": "test-request-id" },
    } as unknown as NextApiRequest;
    const response = responseMock();

    await handler(request, response as unknown as NextApiResponse);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: { procesamientoAsincrono: { estado: "PENDING_RECONCILIATION" } },
    });
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError.mock.calls[0]?.[0]).toContain('"donationId":42');
    expect(consoleError.mock.calls[0]?.[0]).not.toContain("password");
  });
});
