import { performance } from "node:perf_hooks";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

type Strategy = "before" | "after" | "compare";

interface AuthenticationResult {
  validSession: boolean;
  activeUser: boolean;
  validRole: boolean;
  hasValidCity: boolean;
}

interface Measurement {
  strategy: "before" | "after";
  queryCount: number;
  totalMs: number;
  result: AuthenticationResult;
}

function parseStrategy(argumentsList: string[]): Strategy {
  const strategyArgument = argumentsList.find((argument) =>
    argument.startsWith("--strategy="),
  );
  const strategy = strategyArgument?.slice("--strategy=".length);

  if (strategy !== "before" && strategy !== "after" && strategy !== "compare") {
    throw new Error("La estrategia debe ser before, after o compare.");
  }

  if (argumentsList.length !== 1) {
    throw new Error("Argumentos no reconocidos.");
  }

  return strategy;
}

function roundMilliseconds(value: number): number {
  return Math.round(value * 100) / 100;
}

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined || databaseUrl.trim() === "") {
  throw new Error("DATABASE_URL no está configurada.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function measureBefore(sessionId: string): Promise<Measurement> {
  let queryCount = 0;
  const startedAt = performance.now();
  queryCount += 1;
  const session = await prisma.sesion.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      usuario: {
        select: {
          id: true,
          activo: true,
          rol: { select: { codigo: true } },
        },
      },
    },
  });

  if (session === null) {
    throw new Error("No existe una sesión apta para el diagnóstico.");
  }

  queryCount += 1;
  const user = await prisma.usuario.findUnique({
    where: { id: session.usuario.id },
    select: { ciudad: true },
  });

  return {
    strategy: "before",
    queryCount,
    totalMs: roundMilliseconds(performance.now() - startedAt),
    result: {
      validSession:
        session.revokedAt === null && session.expiresAt > new Date(),
      activeUser: session.usuario.activo,
      validRole:
        session.usuario.rol.codigo === "ADMIN" ||
        session.usuario.rol.codigo === "USUARIO",
      hasValidCity: (user?.ciudad.trim().length ?? 0) > 0,
    },
  };
}

async function measureAfter(sessionId: string): Promise<Measurement> {
  let queryCount = 0;
  const startedAt = performance.now();
  queryCount += 1;
  const session = await prisma.sesion.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      usuario: {
        select: {
          id: true,
          activo: true,
          ciudad: true,
          rol: { select: { codigo: true } },
        },
      },
    },
  });

  if (session === null) {
    throw new Error("No existe una sesión apta para el diagnóstico.");
  }

  return {
    strategy: "after",
    queryCount,
    totalMs: roundMilliseconds(performance.now() - startedAt),
    result: {
      validSession:
        session.revokedAt === null && session.expiresAt > new Date(),
      activeUser: session.usuario.activo,
      validRole:
        session.usuario.rol.codigo === "ADMIN" ||
        session.usuario.rol.codigo === "USUARIO",
      hasValidCity: session.usuario.ciudad.trim().length > 0,
    },
  };
}

function publicMeasurement(
  measurement: Measurement,
): Omit<Measurement, "result"> {
  const { result, ...publicResult } = measurement;
  void result;
  return publicResult;
}

async function run(): Promise<void> {
  const strategy = parseStrategy(process.argv.slice(2));
  const candidate = await prisma.sesion.findFirst({
    where: {
      revokedAt: null,
      expiresAt: { gt: new Date() },
      usuario: { activo: true },
    },
    select: { id: true },
  });

  if (candidate === null) {
    throw new Error("No existe una sesión activa para ejecutar el diagnóstico.");
  }

  if (strategy === "before") {
    const before = await measureBefore(candidate.id);
    process.stdout.write(`${JSON.stringify(publicMeasurement(before), null, 2)}\n`);
    return;
  }

  if (strategy === "after") {
    const after = await measureAfter(candidate.id);
    process.stdout.write(`${JSON.stringify(publicMeasurement(after), null, 2)}\n`);
    return;
  }

  const before = await measureBefore(candidate.id);
  const after = await measureAfter(candidate.id);
  const queryReduction = before.queryCount - after.queryCount;

  process.stdout.write(
    `${JSON.stringify(
      {
        strategy: "compare",
        sameResult: JSON.stringify(before.result) === JSON.stringify(after.result),
        before: publicMeasurement(before),
        after: publicMeasurement(after),
        queryReduction,
        queryReductionPercentage: (queryReduction / before.queryCount) * 100,
      },
      null,
      2,
    )}\n`,
  );
}

run()
  .catch(() => {
    process.stderr.write("No fue posible completar el diagnóstico.\n");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
