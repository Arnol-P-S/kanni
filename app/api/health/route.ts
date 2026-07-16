import { NextResponse } from "next/server";

import { getAiCapability } from "@/lib/ai/capability";
import { getGrowthAiCapability } from "@/lib/ai/growth-ai";

export function GET(): NextResponse {
  const capability = getAiCapability();
  const growthAi = getGrowthAiCapability();

  return NextResponse.json(
    {
      status: "ok",
      application: "kanni",
      ai: {
        available: capability.available,
        provider: capability.provider,
        reason: capability.reason,
        deepCheckAvailable: capability.deepCheckAvailable,
      },
      growthAi,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
