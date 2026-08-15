import { Queue } from "bullmq";
import Redis from "ioredis";

import { env } from "@/src/lib/config/env";

export const DONATION_QUEUE_NAME = "donation-notifications";
export const DONATION_CREATED_JOB_NAME = "donation-created";

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
    });
  }

  return globalForDonationQueue.donationQueue;
}

export async function enqueueDonationCreated(
  data: DonationCreatedJobData,
): Promise<void> {
  try {
    await getDonationQueue().add(DONATION_CREATED_JOB_NAME, data);
  } catch {
    throw new DonationQueueUnavailableError();
  }
}
