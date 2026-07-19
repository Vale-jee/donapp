import { Worker } from "bullmq";
import Redis from "ioredis";

import { env } from "@/lib/config/env";
import {
  DONATION_CREATED_JOB_NAME,
  DONATION_QUEUE_NAME,
  type DonationCreatedJobData,
  type DonationCreatedJobResult,
} from "@/src/lib/queue/donation-queue";

const PROCESSING_DELAY_MILLISECONDS = 1500;

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker<
  DonationCreatedJobData,
  DonationCreatedJobResult,
  typeof DONATION_CREATED_JOB_NAME
>(
  DONATION_QUEUE_NAME,
  async (job) => {
    console.info(
      `[donation-worker] Trabajo recibido: ${job.name} (${job.id ?? "sin-id"})`,
      job.data,
    );

    await wait(PROCESSING_DELAY_MILLISECONDS);

    console.info(
      `[donation-worker] Trabajo terminado: ${job.name} (${job.id ?? "sin-id"})`,
    );

    return { notificationProcessed: true };
  },
  { connection },
);

worker.on("ready", () => {
  console.info(`[donation-worker] Escuchando la cola ${DONATION_QUEUE_NAME}.`);
});

worker.on("error", () => {
  console.error(
    "[donation-worker] No fue posible mantener la conexión con Redis.",
  );
});

worker.on("failed", (job) => {
  console.error(
    `[donation-worker] Falló el trabajo ${job?.id ?? "sin-id"}.`,
  );
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.info(`[donation-worker] Cerrando por ${signal}.`);
  await worker.close();
  await connection.quit();
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
