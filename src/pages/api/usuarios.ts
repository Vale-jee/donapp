// API: Consultar usuarios

import type { NextApiRequest, NextApiResponse } from "next";

// Cliente de Prisma
import { prisma } from "@/database/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Permitir únicamente el método GET
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      message: "Método no permitido",
    });
  }

  // Consultar usuarios ordenados por fecha de creación
  const usuarios = await prisma.usuario.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json(usuarios);
}