import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/database/client";

export const PUBLIC_CATEGORY_SELECT = {
  id: true,
  nombre: true,
  descripcion: true,
} satisfies Prisma.CategoriaSelect;

export const ADMINISTRATIVE_CATEGORY_SELECT = {
  ...PUBLIC_CATEGORY_SELECT,
  activo: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategoriaSelect;

export function findActiveCategories() {
  return prisma.categoria.findMany({
    where: { activo: true },
    select: PUBLIC_CATEGORY_SELECT,
    orderBy: { nombre: "asc" },
  });
}

export function findActiveCategoryById(categoryId: number) {
  return prisma.categoria.findFirst({
    where: { id: categoryId, activo: true },
    select: PUBLIC_CATEGORY_SELECT,
  });
}

export function findAdministrativeCategoryById(categoryId: number) {
  return prisma.categoria.findUnique({
    where: { id: categoryId },
    select: ADMINISTRATIVE_CATEGORY_SELECT,
  });
}
