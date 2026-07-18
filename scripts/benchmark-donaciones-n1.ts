import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

import { PrismaClient, type EstadoDonacion } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type Strategy = "before" | "after" | "compare";
type SupportedLimit = 1 | 5 | 10 | 20;
type QueryClassification =
  | "SELECT Donacion"
  | "SELECT Categoria"
  | "SELECT ImagenDonacion"
  | "COUNT ImagenDonacion"
  | "otras";

interface BenchmarkOptions {
  strategy: Strategy;
  limit: SupportedLimit;
}

interface DonationRepresentation {
  id: number;
  titulo: string;
  descripcion: string;
  ciudad: string;
  estado: EstadoDonacion;
  createdAt: Date;
  updatedAt: Date;
  categoria: {
    id: number;
    nombre: string;
  };
  imagenPrincipal: {
    id: number;
    referencia: string;
    orden: number;
  } | null;
  cantidadImagenes: number;
}

interface QueryMetrics {
  total: number;
  durationMs: number;
  breakdown: Record<QueryClassification, number>;
}

interface Measurement {
  strategy: "before" | "after";
  requestedLimit: SupportedLimit;
  foundItems: number;
  prismaQueries: number;
  totalMs: number;
  prismaMs: number;
  queryBreakdown: Record<QueryClassification, number>;
  ids: number[];
  signature: string;
  result: DonationRepresentation[];
}

const supportedLimits = new Set<number>([1, 5, 10, 20]);

function parseArguments(argumentsList: string[]): BenchmarkOptions {
  let strategy: Strategy | undefined;
  let limit: SupportedLimit = 10;

  for (const argument of argumentsList) {
    if (argument.startsWith("--strategy=")) {
      const value = argument.slice("--strategy=".length);

      if (value !== "before" && value !== "after" && value !== "compare") {
        throw new Error("La estrategia debe ser before, after o compare.");
      }

      strategy = value;
      continue;
    }

    if (argument.startsWith("--limit=")) {
      const value = Number(argument.slice("--limit=".length));

      if (!supportedLimits.has(value)) {
        throw new Error("El límite debe ser 1, 5, 10 o 20.");
      }

      limit = value as SupportedLimit;
      continue;
    }

    throw new Error("Argumento no reconocido.");
  }

  if (strategy === undefined) {
    throw new Error("Debe indicar una estrategia.");
  }

  return { strategy, limit };
}

function createMetrics(): QueryMetrics {
  return {
    total: 0,
    durationMs: 0,
    breakdown: {
      "SELECT Donacion": 0,
      "SELECT Categoria": 0,
      "SELECT ImagenDonacion": 0,
      "COUNT ImagenDonacion": 0,
      otras: 0,
    },
  };
}

function classifyQuery(query: string): QueryClassification {
  if (/\bCOUNT\b/iu.test(query) && query.includes("ImagenDonacion")) {
    return "COUNT ImagenDonacion";
  }

  if (/\bSELECT\b/iu.test(query) && query.includes("ImagenDonacion")) {
    return "SELECT ImagenDonacion";
  }

  if (/\bSELECT\b/iu.test(query) && query.includes("Categoria")) {
    return "SELECT Categoria";
  }

  if (/\bSELECT\b/iu.test(query) && query.includes("Donacion")) {
    return "SELECT Donacion";
  }

  return "otras";
}

function roundMilliseconds(value: number): number {
  return Math.round(value * 100) / 100;
}

function createSignature(result: DonationRepresentation[]): string {
  return createHash("sha256").update(JSON.stringify(result)).digest("hex");
}

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined || databaseUrl.trim() === "") {
  throw new Error("DATABASE_URL no está configurada.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({
  adapter,
  log: [{ emit: "event", level: "query" }],
});

let activeMetrics: QueryMetrics | null = null;

prisma.$on("query", (event) => {
  if (activeMetrics === null) {
    return;
  }

  const classification = classifyQuery(event.query);
  activeMetrics.total += 1;
  activeMetrics.durationMs += event.duration;
  activeMetrics.breakdown[classification] += 1;
});

async function listBefore(
  limit: SupportedLimit,
): Promise<DonationRepresentation[]> {
  const donations = await prisma.donacion.findMany({
    take: limit,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      ciudad: true,
      estado: true,
      createdAt: true,
      updatedAt: true,
      categoriaId: true,
    },
  });

  const result: DonationRepresentation[] = [];

  for (const donation of donations) {
    const categoria = await prisma.categoria.findUnique({
      where: { id: donation.categoriaId },
      select: { id: true, nombre: true },
    });
    const imagenPrincipal = await prisma.imagenDonacion.findFirst({
      where: { donacionId: donation.id },
      orderBy: { orden: "asc" },
      select: { id: true, referencia: true, orden: true },
    });
    const cantidadImagenes = await prisma.imagenDonacion.count({
      where: { donacionId: donation.id },
    });

    if (categoria === null) {
      throw new Error("Una donación no tiene una categoría válida.");
    }

    result.push({
      id: donation.id,
      titulo: donation.titulo,
      descripcion: donation.descripcion,
      ciudad: donation.ciudad,
      estado: donation.estado,
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt,
      categoria,
      imagenPrincipal,
      cantidadImagenes,
    });
  }

  return result;
}

async function listAfter(
  limit: SupportedLimit,
): Promise<DonationRepresentation[]> {
  const donations = await prisma.donacion.findMany({
    take: limit,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      ciudad: true,
      estado: true,
      createdAt: true,
      updatedAt: true,
      categoria: {
        select: { id: true, nombre: true },
      },
      imagenes: {
        orderBy: { orden: "asc" },
        take: 1,
        select: { id: true, referencia: true, orden: true },
      },
      _count: {
        select: { imagenes: true },
      },
    },
  });

  return donations.map((donation) => ({
    id: donation.id,
    titulo: donation.titulo,
    descripcion: donation.descripcion,
    ciudad: donation.ciudad,
    estado: donation.estado,
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
    categoria: donation.categoria,
    imagenPrincipal: donation.imagenes[0] ?? null,
    cantidadImagenes: donation._count.imagenes,
  }));
}

async function measure(
  strategy: "before" | "after",
  limit: SupportedLimit,
): Promise<Measurement> {
  const metrics = createMetrics();
  activeMetrics = metrics;
  const startedAt = performance.now();

  try {
    const result =
      strategy === "before" ? await listBefore(limit) : await listAfter(limit);
    const totalMs = performance.now() - startedAt;

    return {
      strategy,
      requestedLimit: limit,
      foundItems: result.length,
      prismaQueries: metrics.total,
      totalMs: roundMilliseconds(totalMs),
      prismaMs: roundMilliseconds(metrics.durationMs),
      queryBreakdown: { ...metrics.breakdown },
      ids: result.map(({ id }) => id),
      signature: createSignature(result),
      result,
    };
  } finally {
    activeMetrics = null;
  }
}

function publicMeasurement(measurement: Measurement): Omit<Measurement, "result"> {
  const { result, ...summary } = measurement;
  void result;
  return summary;
}

async function run(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));

  if (options.strategy !== "compare") {
    const measurement = await measure(options.strategy, options.limit);
    process.stdout.write(`${JSON.stringify(publicMeasurement(measurement), null, 2)}\n`);
    return;
  }

  const before = await measure("before", options.limit);
  const after = await measure("after", options.limit);
  const sameResult = JSON.stringify(before.result) === JSON.stringify(after.result);

  process.stdout.write(
    `${JSON.stringify(
      {
        strategy: "compare",
        requestedLimit: options.limit,
        sameResult,
        before: publicMeasurement(before),
        after: publicMeasurement(after),
        queryReduction: before.prismaQueries - after.prismaQueries,
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
