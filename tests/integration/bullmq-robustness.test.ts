import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { afterAll, describe, expect, it } from "vitest";

import {
  closeDonationQueue,
  DONATION_CREATED_JOB_ATTEMPTS,
  DONATION_CREATED_JOB_NAME,
  DONATION_CREATED_JOB_OPTIONS,
  DONATION_QUEUE_NAME,
  enqueueDonationCreated,
  getDonationCreatedJobId,
} from "@/src/lib/queue/donation-queue";
import { assertSafeIntegrationEnvironment, getTestPrisma } from "@/tests/helpers/integration-environment";

const redisUrl = process.env.REDIS_URL ?? "";
const inspectionConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const inspectionQueue = new Queue(DONATION_QUEUE_NAME, { connection: inspectionConnection });
const temporaryQueues: Array<{ queue: Queue; worker: Worker; connection: Redis; workerConnection: Redis }> = [];

describe("BullMQ de donaciones", () => {
  afterAll(async () => {
    for (const item of temporaryQueues) {
      await item.worker.close();
      await item.workerConnection.quit();
      await item.queue.obliterate({ force: true });
      await item.queue.close();
      await item.connection.quit();
    }
    await inspectionQueue.obliterate({ force: true });
    await inspectionQueue.close();
    await inspectionConnection.quit();
    await closeDonationQueue();
  });

  it("mantiene un solo job al encolar dos veces la misma donación", async () => {
    assertSafeIntegrationEnvironment();
    const data = { donationId: 910_001, userId: 920_001, createdAt: new Date().toISOString() };

    await enqueueDonationCreated(data);
    await enqueueDonationCreated(data);

    const job = await inspectionQueue.getJob(getDonationCreatedJobId(data.donationId));
    const jobs = await inspectionQueue.getJobs(["wait", "delayed", "active", "completed", "failed"]);
    expect(job?.name).toBe(DONATION_CREATED_JOB_NAME);
    expect(jobs.filter(({ id }) => id === job?.id)).toHaveLength(1);
  });

  it("reintenta hasta attempts y conserva el job fallido", async () => {
    assertSafeIntegrationEnvironment();
    const prisma = await getTestPrisma();
    const donationsBefore = await prisma.donacion.count();
    const queueName = `donation-worker-failure-${Date.now()}`;
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    const queue = new Queue(queueName, { connection, defaultJobOptions: DONATION_CREATED_JOB_OPTIONS });
    const workerConnection = connection.duplicate();
    const worker = new Worker(queueName, async () => { throw new Error("simulated processing failure"); }, { connection: workerConnection });
    temporaryQueues.push({ queue, worker, connection, workerConnection });
    const job = await queue.add(DONATION_CREATED_JOB_NAME, { donationId: 910_002 }, {
      attempts: DONATION_CREATED_JOB_ATTEMPTS,
      backoff: { type: "exponential", delay: 10 },
      removeOnFail: DONATION_CREATED_JOB_OPTIONS.removeOnFail,
    });
    const deadline = Date.now() + 10_000;

    while ((await job.getState()) !== "failed" && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    const persisted = await queue.getJob(job.id!);
    expect(await job.getState()).toBe("failed");
    expect(persisted?.attemptsMade).toBe(DONATION_CREATED_JOB_ATTEMPTS);
    expect(persisted).not.toBeUndefined();
    expect(await prisma.donacion.count()).toBe(donationsBefore);
  });
});
