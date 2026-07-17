import { prisma } from "../database/client";
import { RolCodigo } from "../generated/prisma/client";

const expectedRoles: Array<{ codigo: RolCodigo; nombre: string }> = [
  {
    codigo: RolCodigo.ADMIN,
    nombre: "Administrador",
  },
  {
    codigo: RolCodigo.USUARIO,
    nombre: "Usuario",
  },
];

const expectedCategories: Array<{
  nombre: string;
  descripcion: null;
}> = [
  { nombre: "Ropa y calzado", descripcion: null },
  { nombre: "Alimentos", descripcion: null },
  { nombre: "Libros", descripcion: null },
  { nombre: "Juguetes", descripcion: null },
  { nombre: "Tecnología", descripcion: null },
  { nombre: "Muebles", descripcion: null },
  { nombre: "Artículos para el hogar", descripcion: null },
  { nombre: "Salud", descripcion: null },
  { nombre: "Útiles escolares", descripcion: null },
  { nombre: "Otros", descripcion: null },
];

class SeedVerificationError extends Error {}

interface SeedRolesResult {
  created: number;
  roles: Array<{ codigo: RolCodigo; nombre: string }>;
}

interface SeedCategoriesResult {
  created: number;
  categories: Array<{ nombre: string; activo: boolean }>;
}

const normalizeCategoryName = (name: string): string =>
  name.trim().replace(/\s+/gu, " ").toLocaleLowerCase("es");

async function seedRoles(): Promise<SeedRolesResult> {
  const result = await prisma.rol.createMany({
    data: expectedRoles,
    skipDuplicates: true,
  });

  const roles = await prisma.rol.findMany({
    where: {
      codigo: {
        in: expectedRoles.map(({ codigo }) => codigo),
      },
    },
    select: {
      codigo: true,
      nombre: true,
    },
    orderBy: {
      codigo: "asc",
    },
  });

  for (const expectedRole of expectedRoles) {
    const role = roles.find(({ codigo }) => codigo === expectedRole.codigo);

    if (role?.nombre !== expectedRole.nombre) {
      throw new SeedVerificationError(
        `El rol ${expectedRole.codigo} no existe o no conserva el nombre aprobado.`,
      );
    }
  }

  return { created: result.count, roles };
}

async function seedCategories(): Promise<SeedCategoriesResult> {
  const existingCategories = await prisma.categoria.findMany({
    select: {
      nombre: true,
      activo: true,
    },
  });
  const existingNames = new Set(
    existingCategories.map(({ nombre }) => normalizeCategoryName(nombre)),
  );
  const missingCategories = expectedCategories.filter(
    ({ nombre }) => !existingNames.has(normalizeCategoryName(nombre)),
  );
  const result = await prisma.categoria.createMany({
    data: missingCategories.map((category) => ({
      ...category,
      activo: true,
    })),
    skipDuplicates: true,
  });
  const categories = await prisma.categoria.findMany({
    select: {
      nombre: true,
      activo: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });
  const categoryNames = new Set(
    categories.map(({ nombre }) => normalizeCategoryName(nombre)),
  );

  for (const expectedCategory of expectedCategories) {
    if (!categoryNames.has(normalizeCategoryName(expectedCategory.nombre))) {
      throw new SeedVerificationError(
        `La categoria ${expectedCategory.nombre} no existe despues del seed.`,
      );
    }
  }

  return { created: result.count, categories };
}

async function seed(): Promise<void> {
  const roles = await seedRoles();
  const categories = await seedCategories();

  process.stdout.write(`${JSON.stringify({ roles, categories })}\n`);
}

seed()
  .catch((error: unknown) => {
    if (error instanceof SeedVerificationError) {
      process.stderr.write(`${error.message}\n`);
    } else {
      process.stderr.write("No fue posible ejecutar el seed inicial.\n");
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
