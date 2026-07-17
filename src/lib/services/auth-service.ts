import { Prisma, RolCodigo } from "@/generated/prisma/client";
import { prisma } from "@/database/client";
import { ApiError } from "@/src/lib/api/errors";
import { hashPassword } from "@/src/lib/auth/password";
import type { RegisterInput } from "@/src/lib/validations/auth";

const EMAIL_CONFLICT_MESSAGE = "El correo electrónico ya está registrado.";
const USERNAME_CONFLICT_MESSAGE = "El nombre visible ya está en uso.";
const GENERIC_CONFLICT_MESSAGE = "Ya existe un usuario con esos datos.";

function translateUniqueConflict(error: unknown): never {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    throw error;
  }

  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.filter((value): value is string => typeof value === "string")
    : typeof target === "string"
      ? [target]
      : [];

  if (fields.includes("email")) {
    throw new ApiError(409, EMAIL_CONFLICT_MESSAGE);
  }

  if (fields.includes("nombreVisible")) {
    throw new ApiError(409, USERNAME_CONFLICT_MESSAGE);
  }

  throw new ApiError(409, GENERIC_CONFLICT_MESSAGE);
}

export async function registerUser(input: RegisterInput): Promise<void> {
  const role = await prisma.rol.findUnique({
    where: { codigo: RolCodigo.USUARIO },
    select: { id: true },
  });

  if (role === null) {
    throw new Error("El rol USUARIO requerido no existe.");
  }

  const conflict = await prisma.usuario.findFirst({
    where: {
      OR: [{ email: input.email }, { nombreVisible: input.nombreVisible }],
    },
    select: {
      email: true,
      nombreVisible: true,
    },
  });

  if (conflict?.email === input.email) {
    throw new ApiError(409, EMAIL_CONFLICT_MESSAGE);
  }

  if (conflict?.nombreVisible === input.nombreVisible) {
    throw new ApiError(409, USERNAME_CONFLICT_MESSAGE);
  }

  const passwordHash = await hashPassword(input.password);

  try {
    await prisma.usuario.create({
      data: {
        nombreCompleto: input.nombreCompleto,
        nombreVisible: input.nombreVisible,
        email: input.email,
        passwordHash,
        ciudad: input.ciudad,
        telefono: input.telefono,
        fotoPerfil: input.fotoPerfil,
        rolId: role.id,
      },
      select: { id: true },
    });
  } catch (error: unknown) {
    translateUniqueConflict(error);
  }
}
