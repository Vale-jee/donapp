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

class SeedVerificationError extends Error {}

async function seedRoles(): Promise<void> {
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

  process.stdout.write(
    `${JSON.stringify({ created: result.count, roles })}\n`,
  );
}

seedRoles()
  .catch((error: unknown) => {
    if (error instanceof SeedVerificationError) {
      process.stderr.write(`${error.message}\n`);
    } else {
      process.stderr.write("No fue posible ejecutar el seed de roles.\n");
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
