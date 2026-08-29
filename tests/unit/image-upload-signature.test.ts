import { createHash } from "node:crypto";

import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function request(method = "POST") {
  return {
    method,
    headers: {},
    rawHeaders: [],
    query: {},
    url: "/api/imagenes/firma",
  } as unknown as NextApiRequest;
}

describe("firma de carga de imágenes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "donapp-test");
    vi.stubEnv("CLOUDINARY_API_KEY", "public-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "private-test-secret");
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@127.0.0.1:5432/donapp_test");
    vi.stubEnv("REDIS_URL", "redis://127.0.0.1:6379/15");
    vi.stubEnv("AUTH_ACCESS_TOKEN_SECRET", "test-secret-with-at-least-32-characters");
    vi.stubEnv("AUTH_ACCESS_TOKEN_TTL", "15m");
  });

  it("genera la firma esperada, carpeta fija y URL HTTPS", async () => {
    const { createSignedImageUpload, DONATION_IMAGE_FOLDER, DONATION_IMAGE_FORMATS } = await import(
      "@/src/lib/cloudinary/signed-upload"
    );
    const timestamp = 1_787_900_000;
    const result = createSignedImageUpload(new Date(timestamp * 1000));
    const expected = createHash("sha1")
      .update(
        `allowed_formats=${DONATION_IMAGE_FORMATS}` +
          `&folder=${DONATION_IMAGE_FOLDER}&timestamp=${timestamp}private-test-secret`,
      )
      .digest("hex");

    expect(result).toEqual({
      uploadUrl: "https://api.cloudinary.com/v1_1/donapp-test/image/upload",
      apiKey: "public-key",
      timestamp,
      signature: expected,
      folder: "donapp/donaciones",
      allowedFormats: "jpg,jpeg,png,webp",
    });
    expect(JSON.stringify(result)).not.toContain("private-test-secret");
  });

  it("falla de forma segura si falta configuración", async () => {
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const { createSignedImageUpload } = await import("@/src/lib/cloudinary/signed-upload");
    expect(() => createSignedImageUpload()).toThrow("no está configurado");
  });

  it("exige autenticación activa y conserva la respuesta común", async () => {
    const requireAuth = vi.fn().mockResolvedValue({ userId: 7, city: "Bogotá" });
    vi.doMock("@/src/middleware/auth", () => ({ requireAuth }));
    vi.doMock("@/src/lib/security/rate-limit", () => ({
      IMAGE_RATE_LIMIT_POLICY: { name: "test", limit: 1, windowMs: 1 },
      createIpRateLimit: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
    }));
    const { default: handler } = await import("@/src/pages/api/imagenes/firma");
    const response = responseMock();

    await handler(request(), response as unknown as NextApiResponse);

    expect(requireAuth).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Carga de imagen autorizada.",
      data: { folder: "donapp/donaciones" },
    });
    expect(JSON.stringify(response.body)).not.toContain("private-test-secret");
  });

  it("propaga cuenta inactiva como 403 seguro", async () => {
    const { ApiError } = await import("@/src/lib/api/errors");
    vi.doMock("@/src/middleware/auth", () => ({
      requireAuth: vi.fn().mockRejectedValue(new ApiError(403, "La cuenta se encuentra inactiva.")),
    }));
    vi.doMock("@/src/lib/security/rate-limit", () => ({
      IMAGE_RATE_LIMIT_POLICY: { name: "test", limit: 1, windowMs: 1 },
      createIpRateLimit: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
    }));
    const { default: handler } = await import("@/src/pages/api/imagenes/firma");
    const response = responseMock();
    await handler(request(), response as unknown as NextApiResponse);
    expect(response.statusCode).toBe(403);
  });

  it("exige autenticación", async () => {
    const { ApiError } = await import("@/src/lib/api/errors");
    vi.doMock("@/src/middleware/auth", () => ({
      requireAuth: vi.fn().mockRejectedValue(new ApiError(401, "Access token inválido.")),
    }));
    vi.doMock("@/src/lib/security/rate-limit", () => ({
      IMAGE_RATE_LIMIT_POLICY: { name: "test", limit: 1, windowMs: 1 },
      createIpRateLimit: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
    }));
    const { default: handler } = await import("@/src/pages/api/imagenes/firma");
    const response = responseMock();
    await handler(request(), response as unknown as NextApiResponse);
    expect(response.statusCode).toBe(401);
  });

  it("rechaza métodos no permitidos con Allow", async () => {
    vi.doMock("@/src/middleware/auth", () => ({ requireAuth: vi.fn() }));
    vi.doMock("@/src/lib/security/rate-limit", () => ({
      IMAGE_RATE_LIMIT_POLICY: { name: "test", limit: 1, windowMs: 1 },
      createIpRateLimit: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
    }));
    const { default: handler } = await import("@/src/pages/api/imagenes/firma");
    const response = responseMock();
    await handler(request("GET"), response as unknown as NextApiResponse);
    expect(response.statusCode).toBe(405);
    expect(response.setHeader).toHaveBeenCalledWith("Allow", ["POST"]);
  });

  it("aplica rate limiting antes de generar la firma", async () => {
    const { ApiError } = await import("@/src/lib/api/errors");
    vi.doMock("@/src/middleware/auth", () => ({ requireAuth: vi.fn() }));
    vi.doMock("@/src/lib/security/rate-limit", () => ({
      IMAGE_RATE_LIMIT_POLICY: { name: "test", limit: 1, windowMs: 1 },
      createIpRateLimit: vi.fn(() => vi.fn().mockRejectedValue(
        new ApiError(429, "Demasiadas solicitudes.", "rate_limit"),
      )),
    }));
    const { default: handler } = await import("@/src/pages/api/imagenes/firma");
    const response = responseMock();
    await handler(request(), response as unknown as NextApiResponse);
    expect(response.statusCode).toBe(429);
  });
});
