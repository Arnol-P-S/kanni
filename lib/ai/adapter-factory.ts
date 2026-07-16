import "server-only";

import { VercelGatewayTutorAdapter } from "@/lib/ai/adapters/vercel-gateway";
import { getAiCapability } from "@/lib/ai/capability";
import type { TutorModelAdapter } from "@/lib/ai/model-adapter";

/**
 * This factory is the only production entry point for a model adapter.
 * Capability policy is checked again here so a caller cannot bypass the
 * route-level release switch by calling the tutor Facade directly.
 */
export function getConfiguredTutorAdapter(): TutorModelAdapter {
  const capability = getAiCapability();
  if (!capability.available) {
    throw new Error(`AI runtime unavailable: ${capability.reason}`);
  }

  if (capability.provider === "vercel_gateway") {
    return new VercelGatewayTutorAdapter();
  }

  throw new Error(`No adapter is implemented for ${capability.provider}.`);
}
