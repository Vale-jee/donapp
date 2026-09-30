import { describe, expect, it } from "vitest";

// Read-only smoke test against an already running local server. No database
// fixtures, credentials or tokens: a registered protected route must return
// 401 JSON before querying the database, never Next.js's HTML 404 page.
const baseUrl = process.env.DONAPP_ROUTE_SMOKE_URL;

describe.skipIf(!baseUrl)("resolución HTTP de las rutas de donaciones", () => {
  for (const path of ["/api/donaciones/mias", "/api/donaciones/731"]) {
    it(`${path} alcanza la autenticación de la API`, async () => {
      const base = new URL(baseUrl!);
      expect(["localhost", "127.0.0.1", "[::1]"]).toContain(base.hostname);
      const response = await fetch(new URL(path, base), {
        signal: AbortSignal.timeout(20_000),
      });
      expect(response.status).toBe(401);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toMatchObject({
        success: false, status: 401, data: null,
      });
    }, 25_000);
  }
});
