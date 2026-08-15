import { prisma } from "@/database/client";

export function findActiveCategories() {
  return prisma.categoria.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, descripcion: true },
    orderBy: { nombre: "asc" },
  });
}
