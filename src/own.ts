import { createHash, timingSafeEqual } from "node:crypto";

export interface JobRecord {
  id: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "dead";
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  runAt: Date;
  startedAt?: Date | null;
  lockedBy?: string | null;
}

/**
 * 1. claimNextJobs
 * Atomically claims up to batchSize runnable jobs (pending or failed, runAt <= currentTime)
 * using SKIP LOCKED semantics.
 */
export function claimNextJobs(
  workerId: string,
  batchSize: number,
  queue: JobRecord[],
  currentTime: Date = new Date()
): JobRecord[] {
  if (typeof workerId !== "string" || workerId.trim().length === 0) {
    throw new Error("workerId must be a non-empty string");
  }
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error("batchSize must be a positive integer");
  }

  // Filter runnable candidates: status is pending or failed, runAt <= currentTime, unlocked
  const runnable = queue.filter(
    (job) =>
      (job.status === "pending" || job.status === "failed") &&
      job.runAt.getTime() <= currentTime.getTime() &&
      !job.lockedBy
  );

  // Order by runAt ascending (oldest due first)
  runnable.sort((a, b) => a.runAt.getTime() - b.runAt.getTime());

  // Select up to batchSize
  const toClaim = runnable.slice(0, batchSize);

  // Atomically update state
  const claimed: JobRecord[] = [];
  for (const job of toClaim) {
    job.status = "processing";
    job.lockedBy = workerId;
    job.startedAt = new Date(currentTime.getTime());
    claimed.push({ ...job });
  }

  return claimed;
}

/**
 * 2. verifyAdminToken
 * Validates admin request token against configured secret using constant-time comparison
 * to eliminate timing attack side channels.
 */
export function verifyAdminToken(headerValue: unknown, expectedToken: string): boolean {
  if (typeof expectedToken !== "string" || expectedToken.trim().length === 0) {
    throw new Error("Expected admin token must be a configured non-empty string");
  }

  if (typeof headerValue !== "string") {
    return false;
  }

  let token = headerValue.trim();
  if (token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  if (token.length === 0) {
    return false;
  }

  const tokenDigest = createHash("sha256").update(token).digest();
  const expectedDigest = createHash("sha256").update(expectedToken).digest();

  return timingSafeEqual(tokenDigest, expectedDigest);
}

/**
 * 3. calculateExponentialBackoffWithJitter
 * Implements Equal-Jitter exponential backoff:
 *   exponentialDelay = min(capMs, baseMs * 2^(attempt - 1))
 *   halfDelay = exponentialDelay / 2
 *   delay = halfDelay + randomFraction * halfDelay
 */
export function calculateExponentialBackoffWithJitter(
  attempt: number,
  baseMs: number,
  capMs: number,
  randomFraction: number = Math.random()
): number {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new Error("Attempt must be an integer greater than or equal to 1");
  }
  if (typeof baseMs !== "number" || baseMs <= 0 || !Number.isFinite(baseMs)) {
    throw new Error("baseMs must be greater than 0");
  }
  if (typeof capMs !== "number" || capMs < baseMs || !Number.isFinite(capMs)) {
    throw new Error("capMs must be greater than or equal to baseMs");
  }
  if (typeof randomFraction !== "number" || randomFraction < 0 || randomFraction >= 1) {
    throw new Error("randomFraction must be between 0 (inclusive) and 1 (exclusive)");
  }

  const multiplier = Math.pow(2, attempt - 1);
  const uncappedDelay = baseMs * multiplier;
  const exponentialDelay = Math.min(capMs, uncappedDelay);
  const halfDelay = exponentialDelay / 2;
  const delay = halfDelay + randomFraction * halfDelay;

  return Math.round(delay);
}
