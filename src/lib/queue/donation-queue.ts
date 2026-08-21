import { Queue, type JobsOptions } from "bullmq";
import Redis from "ioredis";

import { env } from "@/src/lib/config/env";

export const DONATION_QUEUE_NAME = "donation-notifications";
export const DONATION_CREATED_JOB_NAME = "donation-created";
export const DONATION_CREATED_JOB_ATTEMPTS = 5;
export const DONATION_CREATED_JOB_BACKOFF_DELAY_MS = 2_000;
export const DONATION_CREATED_JOB_OPTIONS = {
  attempts: DONATION_CREATED_JOB_ATTEMPTS,
  backoff: { type: "exponential", delay: DONATION_CREATED_JOB_BACKOFF_DELAY_MS },
  removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
} as const satisfies JobsOptions;

export interface DonationCreatedJobData {
  donationId: number;
  userId: number;
  createdAt: string;
}

export interface DonationCreatedJobResult {
  notificationProcessed: true;
}

export class DonationQueueUnavailableError extends Error {
  constructor() {
    super("No fue posible agregar la notificación a la cola.");
    this.name = "DonationQueueUnavailableError";
  }
}

type DonationQueue = Queue<
  DonationCreatedJobData,
  DonationCreatedJobResult,
  typeof DONATION_CREATED_JOB_NAME
>;

const globalForDonationQueue = globalThis as typeof globalThis & {
  donationQueueRedis?: Redis;
  donationQueue?: DonationQueue;
};

function getDonationQueueRedis(): Redis {
  if (globalForDonationQueue.donationQueueRedis === undefined) {
    globalForDonationQueue.donationQueueRedis = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  return globalForDonationQueue.donationQueueRedis;
}

function getDonationQueue(): DonationQueue {
  if (globalForDonationQueue.donationQueue === undefined) {
    globalForDonationQueue.donationQueue = new Queue(DONATION_QUEUE_NAME, {
      connection: getDonationQueueRedis(),
      defaultJobOptions: DONATION_CREATED_JOB_OPTIONS,
    });
  }

  return globalForDonationQueue.donationQueue;
}

export function getDonationCreatedJobId(donationId: number): string {
  if (!Number.isSafeInteger(donationId) || donationId <= 0) {
    throw new Error("donationId debe ser un entero positivo.");
  }

  return `${DONATION_CREATED_JOB_NAME}-${donationId}`;
}

export async function enqueueDonationCreated(
  data: DonationCreatedJobData,
): Promise<void> {
  try {
    await getDonationQueue().add(DONATION_CREATED_JOB_NAME, data, {
      jobId: getDonationCreatedJobId(data.donationId),
    });
  } catch {
    throw new DonationQueueUnavailableError();
  }
}

export async function closeDonationQueue(): Promise<void> {
  await globalForDonationQueue.donationQueue?.close();
  const redis = globalForDonationQueue.donationQueueRedis;

  if (redis !== undefined && redis.status !== "end") {
    await redis.quit();
  }

  globalForDonationQueue.donationQueue = undefined;
  globalForDonationQueue.donationQueueRedis = undefined;
}
