import { prisma } from "@/database/client";

export interface PublicCategory {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export function listActiveCategories(): Promise<PublicCategory[]> {
  return prisma.categoria.findMany({
    where: {
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });
}
