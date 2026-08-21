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

  it("permite ADMIN y rechaza USUARIO con 403", async () => {
    const adminSession = await registerAndLogin(admin);
    const role = await prisma.rol.findUniqueOrThrow({ where: { codigo: "ADMIN" }, select: { id: true } });
    await prisma.usuario.update({ where: { id: adminSession.usuario.id }, data: { rolId: role.id } });
    const freshAdmin = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: admin.email, password: admin.password }) });
    expect((await api("/api/admin/usuarios", { headers: auth(freshAdmin.body.data.accessToken) })).response.status).toBe(200);
    expect((await api("/api/admin/usuarios", { headers: auth(sessions.get(owner.email)!.accessToken) })).response.status).toBe(403);
  });
});
