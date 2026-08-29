import { EstadoDonacion } from "@/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findDonationDetailContext } = vi.hoisted(() => ({
  findDonationDetailContext: vi.fn(),
}));

vi.mock("@/database/client", () => ({ prisma: {} }));
vi.mock("@/database/donaciones", () => ({
  findDonationDetailContext,
  findAvailableDonationsPage: vi.fn(),
  findDeliveryConfirmationContext: vi.fn(),
  findOwnDonationsPage: vi.fn(),
}));

import { getDonationDetail } from "@/src/lib/services/donacion-service";

const donation = {
  id: 4,
  titulo: "Mesa",
  descripcion: "En buen estado",
  ciudad: "Bogotá",
  estado: EstadoDonacion.PUBLICADA,
  propietarioId: 2,
  createdAt: new Date("2026-08-20T12:00:00.000Z"),
  updatedAt: new Date("2026-08-20T12:00:00.000Z"),
  categoria: { id: 1, nombre: "Muebles" },
  imagenes: [],
  solicitudAceptada: null,
  solicitudes: [],
};

describe("contrato contextual del detalle de donación", () => {
  beforeEach(() => {
    findDonationDetailContext.mockResolvedValue([
      { id: 1, ciudad: "  Bogotá  " },
      donation,
      null,
    ]);
  });

  it("devuelve puedeSolicitar sin exponer propiedad ni relaciones privadas", async () => {
    const result = await getDonationDetail(1, { id: 4 });
    expect(result.donacion.puedeSolicitar).toBe(true);
    expect(result.donacion).not.toHaveProperty("propietarioId");
    expect(result.donacion).not.toHaveProperty("solicitudes");
    expect(result.donacion).not.toHaveProperty("solicitudAceptada");
    expect(result.donacion).not.toHaveProperty("calificacion");
  });

  it("deniega al propietario, con solicitud activa o con calificación pendiente", async () => {
    for (const context of [
      [{ id: 2, ciudad: "Bogotá" }, donation, null],
      [{ id: 1, ciudad: "Bogotá" }, { ...donation, solicitudes: [{ id: 9 }] }, null],
      [{ id: 1, ciudad: "Bogotá" }, donation, { id: 8 }],
    ]) {
      findDonationDetailContext.mockResolvedValueOnce(context);
      const result = await getDonationDetail(
        (context[0] as { id: number }).id,
        { id: 4 },
      );
      expect(result.donacion.puedeSolicitar).toBe(false);
    }
  });
});
