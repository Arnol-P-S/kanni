import { describe, expect, it } from "vitest";

import {
  ADULT_GATE_TTL_SECONDS,
  createAdultGateToken,
  verifyAdultGateToken,
} from "@/lib/adult-gate";

describe("adult-gate token", () => {
  const secret = "a-test-secret-long-enough-for-hmac";
  const start = new Date("2026-07-15T10:00:00.000Z");

  it("accepts a signed token inside its short lifetime", () => {
    const token = createAdultGateToken(secret, start);
    expect(
      verifyAdultGateToken(
        token,
        secret,
        new Date(start.getTime() + (ADULT_GATE_TTL_SECONDS - 1) * 1000),
      ),
    ).toBe(true);
  });

  it("rejects expiration, tampering, and a different secret", () => {
    const token = createAdultGateToken(secret, start);
    expect(
      verifyAdultGateToken(
        token,
        secret,
        new Date(start.getTime() + ADULT_GATE_TTL_SECONDS * 1000),
      ),
    ).toBe(false);
    expect(verifyAdultGateToken(`${token}x`, secret, start)).toBe(false);
    expect(verifyAdultGateToken(token, "wrong-secret", start)).toBe(false);
  });
});
