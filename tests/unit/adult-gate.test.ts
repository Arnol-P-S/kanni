import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADULT_GATE_TTL_SECONDS,
  createAdultGateToken,
  getAdultGateSecret,
  verifyAdultGateToken,
} from "@/lib/adult-gate";

const getAiCapability = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/capability", () => ({ getAiCapability }));

const originalEnvironment = { ...process.env };

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

  it("requires a configured secret of at least 32 characters", () => {
    const original = process.env.ADULT_GATE_SECRET;
    try {
      process.env.ADULT_GATE_SECRET = "short-secret";
      expect(getAdultGateSecret()).toBeNull();
      process.env.ADULT_GATE_SECRET = "x".repeat(32);
      expect(getAdultGateSecret()).toBe("x".repeat(32));
    } finally {
      if (original === undefined) delete process.env.ADULT_GATE_SECRET;
      else process.env.ADULT_GATE_SECRET = original;
    }
  });
});

describe("POST /api/adult-gate", () => {
  beforeEach(() => {
    vi.resetModules();
    getAiCapability.mockReset();
    process.env.ADULT_GATE_SECRET = "route-secret-at-least-32-characters";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...originalEnvironment };
  });

  it("fails closed without setting a cookie when AI is disabled", async () => {
    getAiCapability.mockReturnValue({
      available: false,
      deepCheckAvailable: false,
      provider: "disabled",
      reason: "disabled_by_flag",
    });
    const { POST } = await import("@/app/api/adult-gate/route");
    const response = await POST(
      new Request("http://localhost/api/adult-gate", {
        method: "POST",
        body: JSON.stringify({ confirmed: true }),
      }),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects anything other than explicit confirmation", async () => {
    getAiCapability.mockReturnValue({
      available: true,
      deepCheckAvailable: false,
      provider: "openai_direct",
      reason: "available",
    });
    const { POST } = await import("@/app/api/adult-gate/route");
    const response = await POST(
      new Request("http://localhost/api/adult-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: false }),
      }),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sets a short-lived hardened cookie after valid confirmation", async () => {
    getAiCapability.mockReturnValue({
      available: true,
      deepCheckAvailable: true,
      provider: "openai_direct",
      reason: "available",
    });
    vi.stubEnv("NODE_ENV", "production");
    const { POST } = await import("@/app/api/adult-gate/route");
    const response = await POST(
      new Request("https://example.test/api/adult-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      }),
    );
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(response.status).toBe(200);
    expect(cookie).toContain("kanni_adult_gate=");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=strict/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/Path=\//i);
    expect(cookie).toContain(`Max-Age=${ADULT_GATE_TTL_SECONDS}`);
  });
});
