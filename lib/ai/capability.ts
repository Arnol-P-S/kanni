import "server-only";

import type { AiProvider, PublicAiCapability } from "@/lib/domain";

function configuredProvider(): AiProvider | null {
  const value = process.env.AI_PROVIDER?.trim() || "disabled";
  return value === "disabled" ||
    value === "vercel_gateway" ||
    value === "openai_direct"
    ? value
    : null;
}

export function getAiCapability(): PublicAiCapability {
  const provider = configuredProvider();
  if (!provider) {
    return {
      available: false,
      deepCheckAvailable: false,
      provider: "disabled",
      reason: "provider_misconfigured",
    };
  }
  if (process.env.AI_DEMO_ENABLED !== "true") {
    return {
      available: false,
      deepCheckAvailable: false,
      provider,
      reason: "disabled_by_flag",
    };
  }
  if (provider === "disabled") {
    return {
      available: false,
      deepCheckAvailable: false,
      provider,
      reason: "provider_disabled",
    };
  }

  // Vercel's current AI Services policy prohibits online services directed at
  // children. Kanni remains child-directed, so this adapter is retained only
  // as an integration boundary and cannot be activated for this release.
  if (provider === "vercel_gateway") {
    return {
      available: false,
      deepCheckAvailable: false,
      provider,
      reason: "provider_policy_blocked",
    };
  }

  if (provider === "openai_direct") {
    return {
      available: false,
      deepCheckAvailable: false,
      provider,
      reason: "provider_not_implemented",
    };
  }

  return {
    available: false,
    deepCheckAvailable: false,
    provider,
    reason: "provider_not_implemented",
  };
}
