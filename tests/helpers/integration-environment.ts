import { createHash } from "node:crypto";

const RUN_ID = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const normalizedRunSuffix = RUN_ID.replace(/[^\p{L}\p{N}._]/gu, "_").slice(-6);

function testUsername(label: string): string {
  const normalizedLabel = label.replace(/[^\p{L}\p{N}._]/gu, "_");
  const labelSuffix = createHash("sha256").update(label).digest("hex").slice(0, 6);

  return `${normalizedLabel.slice(0, 15)}_${labelSuffix}_${normalizedRunSuffix}`;
}

export const testIdentity = (label: string) => ({
  nombreCompleto: `Prueba ${label}`,
  nombreVisible: testUsername(label),
  email: `${RUN_ID}-${label}@donapp.test`,
  password: "ClaveSegura123",
  ciudad: "Bogotá",
});
export const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3100";

export function assertSafeIntegrationEnvironment(): void {
  if (process.env.DONAPP_INTEGRATION_TESTS !== "true") throw new Error("Defina DONAPP_INTEGRATION_TESTS=true para autorizar la suite de integración.");
  const database = new URL(process.env.DATABASE_URL ?? "");
  const redis = new URL(process.env.REDIS_URL ?? "");
  const api = new URL(baseUrl);
  const local = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (!local.has(database.hostname) || !database.pathname.toLowerCase().includes("test")) throw new Error("DATABASE_URL debe apuntar a PostgreSQL local y a una base cuyo nombre contenga 'test'.");
  if (!local.has(redis.hostname) || ["", "/", "/0"].includes(redis.pathname)) throw new Error("REDIS_URL debe apuntar a Redis local y a una base lógica distinta de 0.");
  if (!local.has(api.hostname)) throw new Error("TEST_BASE_URL debe ser local.");
}

export async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }), ...init.headers },
  });
  const body = await response.json();
  return { response, body };
}

export const auth = (token: string) => ({ authorization: `Bearer ${token}` });

export async function getTestPrisma() {
  return (await import("@/database/client")).prisma;
}

export async function cleanupOwnedFixtures(): Promise<void> {
  const prisma = await getTestPrisma();
  const users = await prisma.usuario.findMany({ where: { email: { startsWith: RUN_ID } }, select: { id: true } });
  const userIds = users.map(({ id }) => id);
  const donations = await prisma.donacion.findMany({ where: { propietarioId: { in: userIds } }, select: { id: true } });
  const donationIds = donations.map(({ id }) => id);
  const requests = await prisma.solicitud.findMany({ where: { OR: [{ solicitanteId: { in: userIds } }, { donacionId: { in: donationIds } }] }, select: { id: true } });
  const requestIds = requests.map(({ id }) => id);
  const chats = await prisma.chat.findMany({ where: { solicitudId: { in: requestIds } }, select: { id: true } });
  const chatIds = chats.map(({ id }) => id);
  await prisma.$transaction([
    prisma.mensaje.deleteMany({ where: { OR: [{ chatId: { in: chatIds } }, { remitenteId: { in: userIds } }] } }),
    prisma.chat.deleteMany({ where: { id: { in: chatIds } } }),
    prisma.calificacion.deleteMany({ where: { donacionId: { in: donationIds } } }),
    prisma.exencionCalificacion.deleteMany({ where: { donacionId: { in: donationIds } } }),
    prisma.donacion.updateMany({ where: { id: { in: donationIds } }, data: { solicitudAceptadaId: null } }),
    prisma.solicitud.deleteMany({ where: { id: { in: requestIds } } }),
    prisma.imagenDonacion.deleteMany({ where: { donacionId: { in: donationIds } } }),
    prisma.donacion.deleteMany({ where: { id: { in: donationIds } } }),
    prisma.auditoriaAdministrativa.deleteMany({ where: { administradorId: { in: userIds } } }),
    prisma.sesion.deleteMany({ where: { usuarioId: { in: userIds } } }),
    prisma.usuario.deleteMany({ where: { id: { in: userIds } } }),
    prisma.categoria.deleteMany({ where: { nombre: `${RUN_ID}-categoria` } }),
  ]);
}

export async function disconnectTestDatabase(): Promise<void> { await (await getTestPrisma()).$disconnect(); }
export const fixtureCategoryName = `${RUN_ID}-categoria`;
