import { EstadoDonacion } from "@/generated/prisma/client";

export function canRequestDonation(input: {
  donationStatus: EstadoDonacion;
  donationCity: string;
  userCity: string;
  isOwner: boolean;
  hasActiveRequest: boolean;
  hasPendingRating: boolean;
}): boolean {
  return (
    input.donationStatus === EstadoDonacion.PUBLICADA &&
    input.donationCity === input.userCity.trim() &&
    !input.isOwner &&
    !input.hasActiveRequest &&
    !input.hasPendingRating
  );
}
