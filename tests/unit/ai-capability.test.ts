import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalEnvironment = { ...process.env };

describe("AI release capability", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.AI_PROVIDER;
    delete process.env.AI_DEMO_ENABLED;
    delete process.env.AI_DEEP_CHECK_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it("fails closed when no provider is enabled", async () => {
    const { getAiCapability } = await import("@/lib/ai/capability");
    expect(getAiCapability()).toMatchObject({
      available: false,
      provider: "disabled",
      reason: "disabled_by_flag",
    });
  });

  it("cannot enable the policy-blocked Gateway adapter with environment flags", async () => {
    process.env.AI_PROVIDER = "vercel_gateway";
    process.env.AI_DEMO_ENABLED = "true";
    process.env.AI_DEEP_CHECK_ENABLED = "true";
    const { getAiCapability } = await import("@/lib/ai/capability");
    expect(getAiCapability()).toEqual({
      available: false,
      deepCheckAvailable: false,
      provider: "vercel_gateway",
      reason: "provider_policy_blocked",
    });
  });

  it("keeps the future direct provider unavailable until an adapter exists", async () => {
    process.env.AI_PROVIDER = "openai_direct";
    process.env.AI_DEMO_ENABLED = "true";
    const { getAiCapability } = await import("@/lib/ai/capability");
    expect(getAiCapability()).toMatchObject({
      available: false,
      provider: "openai_direct",
      reason: "provider_not_implemented",
    });
  });

  it("publishes only the public capability contract from health", async () => {
    const { GET } = await import("@/app/api/health/route");
    const body = await GET().json();
    expect(body).toEqual({
      status: "ok",
      application: "kanni",
      ai: {
        available: false,
        deepCheckAvailable: false,
        provider: "disabled",
        reason: "disabled_by_flag",
      },
      growthAi: {
        available: false,
        provider: "disabled",
        model: "openai/gpt-5.6-sol",
        reason: "disabled_by_flag",
      },
    });
    expect(JSON.stringify(body)).not.toMatch(
      /credential|secret|keyConfigured|primaryModel|criticModel/i,
    );
  });
});
