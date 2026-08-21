import { prisma } from "@/database/client";
import {
  closeDonationQueue,
  enqueueDonationCreated,
  getDonationCreatedJobId,
} from "@/src/lib/queue/donation-queue";

function requestedDonationIds(arguments_: string[]): number[] {
  const ids = arguments_.map((argument) => {
    const match = /^--donation-id=(\d+)$/u.exec(argument);
    const id = match === null ? Number.NaN : Number(match[1]);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("Use uno o más argumentos --donation-id=<entero-positivo>.");
    }

    return id;
  });

  if (ids.length === 0) {
    throw new Error("Debe indicar al menos un --donation-id.");
  }

  return [...new Set(ids)];
}

async function main(): Promise<void> {
  const ids = requestedDonationIds(process.argv.slice(2));
  const donations = await prisma.donacion.findMany({
    where: { id: { in: ids } },
    select: { id: true, propietarioId: true, createdAt: true },
  });
  const foundIds = new Set(donations.map(({ id }) => id));
  const missingIds = ids.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    throw new Error(`Donaciones inexistentes: ${missingIds.join(", ")}.`);
  }

  for (const donation of donations) {
    await enqueueDonationCreated({
      donationId: donation.id,
      userId: donation.propietarioId,
      createdAt: donation.createdAt.toISOString(),
    });
    console.info(
      JSON.stringify({
        event: "donation_job_reconciled",
        donationId: donation.id,
        jobId: getDonationCreatedJobId(donation.id),
      }),
    );
  }
}

void main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Falló la reconciliación.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDonationQueue();
    await prisma.$disconnect();
  });
