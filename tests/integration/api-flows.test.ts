import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { api, assertSafeIntegrationEnvironment, auth, baseUrl, cleanupOwnedFixtures, disconnectTestDatabase, fixtureCategoryName, getTestPrisma, testIdentity } from "@/tests/helpers/integration-environment";

type Session = { accessToken: string; refreshToken: string; usuario: { id: number } };
const owner = testIdentity("owner");
const receiverA = testIdentity("receiver-a");
const receiverB = testIdentity("receiver-b");
const inactive = testIdentity("inactive");
const admin = testIdentity("admin");
let categoryId: number;
let prisma: PrismaClient;
let environmentReady = false;
const sessions = new Map<string, Session>();

async function registerAndLogin(identity: ReturnType<typeof testIdentity>): Promise<Session> {
  expect((await api("/api/auth/register", { method: "POST", body: JSON.stringify(identity) })).response.status).toBe(201);
  const login = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: identity.email, password: identity.password }) });
  expect(login.response.status).toBe(200);
  const session = login.body.data as Session; sessions.set(identity.email, session); return session;
}

describe("API de DonApp", () => {
  beforeAll(async () => {
    assertSafeIntegrationEnvironment();
    prisma = await getTestPrisma();
    await cleanupOwnedFixtures();
    const category = await prisma.categoria.create({ data: { nombre: fixtureCategoryName, descripcion: "Fixture aislado de integración" }, select: { id: true } });
    categoryId = category.id;
    environmentReady = true;
  });
  afterAll(async () => { if (environmentReady) { await cleanupOwnedFixtures(); await disconnectTestDatabase(); } });

  it("cubre autenticación, rotación, sesión inválida, logout, cuenta inactiva y JSON malformado", async () => {
    const session = await registerAndLogin(owner);
    expect((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: owner.email, password: "Incorrecta123" }) })).response.status).toBe(401);
    expect((await api("/api/usuarios/perfil", { headers: auth("token-invalido") })).response.status).toBe(401);
    const rotated = await api("/api/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: session.refreshToken }) });
    expect(rotated.response.status).toBe(200);
    expect((await api("/api/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: session.refreshToken }) })).response.status).toBe(401);
    const current = rotated.body.data as Session;
    expect((await api("/api/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: current.refreshToken }) })).response.status).toBe(200);
    const relogin = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: owner.email, password: owner.password }) });
    sessions.set(owner.email, relogin.body.data as Session);
    const inactiveSession = await registerAndLogin(inactive);
    await prisma.usuario.update({ where: { id: inactiveSession.usuario.id }, data: { activo: false } });
    expect((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: inactive.email, password: inactive.password }) })).response.status).toBe(403);
    const malformed = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: "{malformed" });
    expect(malformed.status).toBe(400);
  });

  it("aplica rate limiting por correo tras fallos repetidos", async () => {
    const identity = testIdentity("limited");
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) statuses.push((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: identity.email, password: "Incorrecta123" }) })).response.status);
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
  });

  it("automatiza el flujo principal y una aceptación concurrente", async () => {
    const ownerSession = sessions.get(owner.email)!;
    const a = await registerAndLogin(receiverA); const b = await registerAndLogin(receiverB);
    const created = await api("/api/donaciones", { method: "POST", headers: auth(ownerSession.accessToken), body: JSON.stringify({ titulo: "Mesa de integración", descripcion: "Mesa de madera en buen estado para donar.", categoriaId: categoryId, imagenes: ["/tests/mesa.jpg"] }) });
    expect(created.response.status).toBe(201);
    const donationId = created.body.data.donacion.id as number;
    const requestA = await api("/api/solicitudes", { method: "POST", headers: auth(a.accessToken), body: JSON.stringify({ donacionId: donationId }) });
    const requestB = await api("/api/solicitudes", { method: "POST", headers: auth(b.accessToken), body: JSON.stringify({ donacionId: donationId }) });
    const candidates = [{ id: requestA.body.data.solicitud.id as number, session: a }, { id: requestB.body.data.solicitud.id as number, session: b }];
    const accepted = await Promise.all(candidates.map((candidate) => api(`/api/solicitudes/${candidate.id}/aceptar`, { method: "PATCH", headers: auth(ownerSession.accessToken), body: "{}" })));
    expect(accepted.map(({ response }) => response.status).sort()).toEqual([200, 409]);
    const winnerIndex = accepted.findIndex(({ response }) => response.status === 200);
    const winner = candidates[winnerIndex];
    expect((await prisma.donacion.findUniqueOrThrow({ where: { id: donationId } })).estado).toBe("RESERVADA");
    const chat = await api(`/api/solicitudes/${winner.id}/chat`, { method: "POST", headers: auth(winner.session.accessToken), body: "{}" });
    expect([200, 201]).toContain(chat.response.status);
    const chatId = chat.body.data.chat.id as number;
    expect((await api(`/api/chats/${chatId}/mensajes`, { method: "POST", headers: auth(winner.session.accessToken), body: JSON.stringify({ contenido: "Coordino la entrega mañana." }) })).response.status).toBe(201);
    expect((await api(`/api/donaciones/${donationId}/confirmacion-entrega`, { method: "PATCH", headers: auth(ownerSession.accessToken), body: "{}" })).response.status).toBe(200);
    expect((await api(`/api/donaciones/${donationId}/confirmacion-entrega`, { method: "PATCH", headers: auth(winner.session.accessToken), body: "{}" })).response.status).toBe(200);
    expect((await prisma.donacion.findUniqueOrThrow({ where: { id: donationId } })).estado).toBe("ENTREGADA");
    expect((await api(`/api/donaciones/${donationId}/calificacion`, { method: "POST", headers: auth(winner.session.accessToken), body: JSON.stringify({ puntuacion: 5 }) })).response.status).toBe(201);
  });

  it("DELETE elimina únicamente la publicación elegible y sus imágenes en PostgreSQL", async () => {
    const session = sessions.get(owner.email)!;
    const created = await api("/api/donaciones", {
      method: "POST", headers: auth(session.accessToken), body: JSON.stringify({
        titulo: "Mesa para eliminar", descripcion: "Mesa de prueba para eliminación física.",
        categoriaId: categoryId, imagenes: ["/tests/delete-1.jpg", "/tests/delete-2.jpg"],
      }),
    });
    expect(created.response.status).toBe(201);
    const id = created.body.data.donacion.id as number;
    expect(await prisma.imagenDonacion.count({ where: { donacionId: id } })).toBe(2);
    const result = await api(`/api/donaciones/${id}`, { method: "DELETE", headers: auth(session.accessToken) });
    expect(result.response.status).toBe(200);
    expect(result.body.data).toEqual({ id });
    expect(await prisma.donacion.findUnique({ where: { id } })).toBeNull();
    expect(await prisma.imagenDonacion.count({ where: { donacionId: id } })).toBe(0);
    expect((await api(`/api/donaciones/${id}`, { method: "DELETE", headers: auth(session.accessToken) })).response.status).toBe(404);
  });

  it("DELETE rechaza autenticación, propiedad, estado e historial sin modificar relaciones", async () => {
    const session = sessions.get(owner.email)!;
    const other = sessions.get(receiverA.email)!;
    async function publication() {
      return prisma.donacion.create({ data: {
        titulo: "Publicación protegida", descripcion: "Fixture para verificar conservación de historial.",
        ciudad: "Bogotá", propietarioId: session.usuario.id, categoriaId: categoryId,
        imagenes: { create: { referencia: "/tests/protected.jpg", orden: 1 } },
      }, select: { id: true } });
    }
    async function snapshot(id: number) {
      return prisma.donacion.findUnique({ where: { id }, include: {
        imagenes: true, solicitudes: { include: { chat: { include: { mensajes: true } } } },
        calificacion: true, exencionCalificacion: true,
      } });
    }
    const plain = await publication();
    const original = await snapshot(plain.id);
    expect((await api(`/api/donaciones/${plain.id}`, { method: "DELETE" })).response.status).toBe(401);
    expect((await api(`/api/donaciones/${plain.id}`, { method: "DELETE", headers: auth(other.accessToken) })).response.status).toBe(404);
    expect(await snapshot(plain.id)).toEqual(original);
    expect((await api("/api/donaciones/0", { method: "DELETE", headers: auth(session.accessToken) })).response.status).toBe(400);

    for (const estado of ["RESERVADA", "ENTREGADA", "RETIRADA"] as const) {
      await prisma.donacion.update({ where: { id: plain.id }, data: { estado } });
      const before = await snapshot(plain.id);
      expect((await api(`/api/donaciones/${plain.id}`, { method: "DELETE", headers: auth(session.accessToken) })).response.status).toBe(409);
      expect(await snapshot(plain.id)).toEqual(before);
    }
    for (const estado of ["PENDIENTE", "ACEPTADA", "RECHAZADA", "CANCELADA"] as const) {
      const donation = await publication();
      await prisma.solicitud.create({ data: {
        donacionId: donation.id, solicitanteId: other.usuario.id, estado,
        chat: { create: { mensajes: { create: { remitenteId: other.usuario.id, contenido: "Historial que se conserva." } } } },
      } });
      const before = await snapshot(donation.id);
      const result = await api(`/api/donaciones/${donation.id}`, { method: "DELETE", headers: auth(session.accessToken) });
      expect(result.response.status).toBe(409);
      expect(result.body.message).toBe("Esta donación no se puede eliminar porque ya tiene solicitudes asociadas.");
      expect(await snapshot(donation.id)).toEqual(before);
    }
    // These states are not created by the business services, but the schema permits them.
    for (const relation of ["calificacion", "exencion"] as const) {
      const donation = await publication();
      if (relation === "calificacion") {
        await prisma.calificacion.create({ data: { donacionId: donation.id, puntuacion: 5 } });
      } else {
        await prisma.exencionCalificacion.create({ data: {
          donacionId: donation.id, administradorId: session.usuario.id, motivo: "Historial de prueba que debe conservarse.",
        } });
      }
      const before = await snapshot(donation.id);
      expect((await api(`/api/donaciones/${donation.id}`, { method: "DELETE", headers: auth(session.accessToken) })).response.status).toBe(409);
      expect(await snapshot(donation.id)).toEqual(before);
    }
  });

  it("permite ADMIN y rechaza USUARIO con 403", async () => {
    const adminSession = await registerAndLogin(admin);
    const role = await prisma.rol.findUniqueOrThrow({ where: { codigo: "ADMIN" }, select: { id: true } });
    await prisma.usuario.update({ where: { id: adminSession.usuario.id }, data: { rolId: role.id } });
    const freshAdmin = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: admin.email, password: admin.password }) });
    expect((await api("/api/admin/usuarios", { headers: auth(freshAdmin.body.data.accessToken) })).response.status).toBe(200);
    expect((await api("/api/admin/usuarios", { headers: auth(sessions.get(owner.email)!.accessToken) })).response.status).toBe(403);
  });
});
