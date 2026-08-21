import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import type { NextApiRequest, NextApiResponse } from "next";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/src/lib/api/logger", () => ({ logApiRequest: vi.fn() }));
import { withApiInfrastructure } from "@/src/lib/api/api-handler";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { sendSuccess } from "@/src/lib/api/responses";

function responseMock() {
  const headers = new Map<string, string>();
  const response = new EventEmitter() as NextApiResponse & { body?: unknown };
  response.statusCode = 200;
  response.setHeader = vi.fn((name: string, value: number | string | readonly string[]) => { headers.set(name.toLowerCase(), String(value)); return response; });
  response.getHeader = vi.fn((name: string) => headers.get(name.toLowerCase()));
  response.status = vi.fn((status: number) => { response.statusCode = status; return response; });
  response.json = vi.fn((body: unknown) => { response.body = body; return response; });
  return response;
}

describe("contrato HTTP uniforme", () => {
  it("serializa éxito y ApiError con el contrato aprobado", () => {
    const ok = responseMock();
    sendSuccess(ok, 201, "Creado", { id: 1 });
    expect(ok.body).toEqual({ success: true, message: "Creado", data: { id: 1 } });
    const error = responseMock();
    expect(handleApiError(new ApiError(403, "Prohibido", "authorization"), error)).toMatchObject({ status: 403, category: "authorization" });
    expect(error.body).toEqual({ success: false, status: 403, message: "Prohibido", data: null });
  });

  it("convierte ZodError a errores de campo y sanitiza errores técnicos", () => {
    const schema = z.object({ email: z.email("Correo inválido") });
    const validation = responseMock();
    try { schema.parse({ email: "x" }); } catch (error) { handleApiError(error, validation); }
    expect(validation.body).toMatchObject({ success: false, status: 400, data: null, errors: [{ field: "email", message: "Correo inválido" }] });
    const internal = responseMock();
    handleApiError(new Error("passwordHash=secreto"), internal);
    expect(internal.body).toEqual({ success: false, status: 500, message: "Error interno del servidor", data: null });
  });

  it("acepta request ID UUID v4 válido y reemplaza uno no confiable", async () => {
    for (const supplied of ["550e8400-e29b-41d4-a716-446655440000", "../../ataque"]) {
      const request = Readable.from([]) as NextApiRequest;
      request.method = "GET"; request.url = "/api/test"; request.headers = { "x-donapp-request-id": supplied };
      const response = responseMock();
      await withApiInfrastructure((_request, res) => sendSuccess(res, 200, "OK", {}))(request, response);
      const id = response.getHeader("x-request-id");
      expect(id).toMatch(/^[0-9a-f-]{36}$/u);
      expect(request.headers["x-request-id"]).toBe(id);
      if (supplied.startsWith("550e")) expect(id).toBe(supplied); else expect(id).not.toBe(supplied);
    }
  });

  it("rechaza JSON malformado antes del handler", async () => {
    const request = Readable.from(["{malformed"]) as NextApiRequest;
    request.method = "POST"; request.url = "/api/test"; request.headers = {};
    const response = responseMock();
    const handler = vi.fn();
    await withApiInfrastructure(handler, { parseJsonBody: true })(request, response);
    expect(handler).not.toHaveBeenCalled();
    expect(response.body).toMatchObject({ success: false, status: 400, data: null });
  });
});
