import { EstadoDonacion } from "@/generated/prisma/client";
import { canRequestDonation } from "@/src/lib/services/request-eligibility";
import { describe, expect, it } from "vitest";

const eligible = {
  donationStatus: EstadoDonacion.PUBLICADA,
  donationCity: "Bogotá",
  userCity: "Bogotá",
  isOwner: false,
  hasActiveRequest: false,
  hasPendingRating: false,
};

describe("permiso contextual para solicitar una donación", () => {
  it("permite una publicación ajena, publicada y de la misma ciudad", () => {
    expect(canRequestDonation(eligible)).toBe(true);
  });

  it.each([
    ["propietario", { isOwner: true }],
    ["solicitud pendiente o aceptada", { hasActiveRequest: true }],
    ["calificación pendiente", { hasPendingRating: true }],
    ["estado no publicado", { donationStatus: EstadoDonacion.RESERVADA }],
    ["otra ciudad", { donationCity: "Medellín" }],
  ])("deniega por %s", (_reason, change) => {
    expect(canRequestDonation({ ...eligible, ...change })).toBe(false);
  });

  it("normaliza la ciudad autenticada como el POST", () => {
    expect(canRequestDonation({ ...eligible, userCity: "  Bogotá  " })).toBe(
      true,
    );
  });

  it("permite después de una solicitud rechazada", () => {
    expect(canRequestDonation({ ...eligible, hasActiveRequest: false })).toBe(
      true,
    );
  });

  it("permite después de una solicitud cancelada", () => {
    expect(canRequestDonation({ ...eligible, hasActiveRequest: false })).toBe(
      true,
    );
  });

  it("permite cuando una exención elimina la calificación pendiente", () => {
    expect(canRequestDonation(eligible)).toBe(true);
  });
});
