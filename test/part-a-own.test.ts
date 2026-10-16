import { describe, it, expect } from "vitest";
import {
  claimNextJobs,
  verifyAdminToken,
  calculateExponentialBackoffWithJitter,
  JobRecord,
} from "../src/own.js";

describe("Part A1: Own Functions Trace Verification", () => {
  describe("1. claimNextJobs", () => {
    it("Scenario 1 (Normal): claims due jobs up to batch size in runAt order", () => {
      const currentTime = new Date("2026-10-16T10:05:00.000Z");
      const queue: JobRecord[] = [
        {
          id: "job-1",
          status: "pending",
          type: "email",
          payload: { to: "user1@example.com" },
          attempts: 0,
          maxAttempts: 3,
          runAt: new Date("2026-10-16T10:00:00.000Z"),
          lockedBy: null,
          startedAt: null,
        },
        {
          id: "job-2",
          status: "failed",
          type: "email",
          payload: { to: "user2@example.com" },
          attempts: 1,
          maxAttempts: 3,
          runAt: new Date("2026-10-16T10:01:00.000Z"),
          lockedBy: null,
          startedAt: null,
        },
        {
          id: "job-3",
          status: "pending",
          type: "email",
          payload: { to: "user3@example.com" },
          attempts: 0,
          maxAttempts: 3,
          runAt: new Date("2026-10-16T10:15:00.000Z"),
          lockedBy: null,
          startedAt: null,
        },
      ];

      const claimed = claimNextJobs("worker-prod-1", 2, queue, currentTime);

      expect(claimed).toHaveLength(2);
      expect(claimed[0].id).toBe("job-1");
      expect(claimed[0].status).toBe("processing");
      expect(claimed[0].lockedBy).toBe("worker-prod-1");
      expect(claimed[0].startedAt?.toISOString()).toBe(currentTime.toISOString());

      expect(claimed[1].id).toBe("job-2");
      expect(claimed[1].status).toBe("processing");
      expect(claimed[1].lockedBy).toBe("worker-prod-1");
      expect(claimed[1].startedAt?.toISOString()).toBe(currentTime.toISOString());

      // Job 3 must remain untouched in queue
      expect(queue[2].status).toBe("pending");
      expect(queue[2].lockedBy).toBeNull();
    });

    it("Scenario 2 (Edge): returns empty list when no jobs are due or unlocked", () => {
      const currentTime = new Date("2026-10-16T10:00:00.000Z");
      const queue: JobRecord[] = [
        {
          id: "job-1",
          status: "processing",
          type: "email",
          payload: {},
          attempts: 1,
          maxAttempts: 3,
          runAt: new Date("2026-10-16T09:00:00.000Z"),
          lockedBy: "worker-other",
          startedAt: new Date("2026-10-16T09:00:00.000Z"),
        },
        {
          id: "job-2",
          status: "pending",
          type: "email",
          payload: {},
          attempts: 0,
          maxAttempts: 3,
          runAt: new Date("2026-10-16T11:00:00.000Z"),
          lockedBy: null,
          startedAt: null,
        },
      ];

      const claimed = claimNextJobs("worker-prod-1", 5, queue, currentTime);
      expect(claimed).toEqual([]);
    });

    it("Scenario 3 (Invalid): throws error if workerId is empty or whitespace", () => {
      const queue: JobRecord[] = [];
      expect(() => claimNextJobs("   ", 2, queue)).toThrow(
        "workerId must be a non-empty string"
      );
    });
  });

  describe("2. verifyAdminToken", () => {
    const expectedToken = "secret-adm-999";

    it("Scenario 1 (Normal): returns true for matching Bearer token header", () => {
      const result = verifyAdminToken("Bearer secret-adm-999", expectedToken);
      expect(result).toBe(true);
    });

    it("Scenario 2 (Edge): returns false for mismatched token header without error", () => {
      const result = verifyAdminToken("Bearer wrong-token-xyz", expectedToken);
      expect(result).toBe(false);

      // Non-string or missing header should also return false
      expect(verifyAdminToken(undefined, expectedToken)).toBe(false);
      expect(verifyAdminToken(null, expectedToken)).toBe(false);
      expect(verifyAdminToken("", expectedToken)).toBe(false);
    });

    it("Scenario 3 (Invalid): throws error if server secret is empty or unconfigured", () => {
      expect(() => verifyAdminToken("Bearer secret-adm-999", "")).toThrow(
        "Expected admin token must be a configured non-empty string"
      );
    });
  });

  describe("3. calculateExponentialBackoffWithJitter", () => {
    it("Scenario 1 (Normal): computes equal-jitter backoff for attempt 3, randomFraction 0.5", () => {
      // attempt 3, base 1000, cap 30000, random 0.5
      // multiplier = 2^(3-1) = 4
      // uncapped = 4000, capped = 4000, half = 2000, jitter = 1000, delay = 3000
      const delay = calculateExponentialBackoffWithJitter(3, 1000, 30000, 0.5);
      expect(delay).toBe(3000);
    });

    it("Scenario 2 (Edge): caps backoff at capMs for high attempts with randomFraction 0.0", () => {
      // attempt 10, base 1000, cap 30000, random 0.0
      // capped = 30000, half = 15000, jitter = 0, delay = 15000
      const delay = calculateExponentialBackoffWithJitter(10, 1000, 30000, 0.0);
      expect(delay).toBe(15000);
    });

    it("Scenario 3 (Invalid): throws error for attempt < 1", () => {
      expect(() =>
        calculateExponentialBackoffWithJitter(0, 1000, 30000, 0.5)
      ).toThrow("Attempt must be an integer greater than or equal to 1");
    });
  });
});
