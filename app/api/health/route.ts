import { NextResponse } from "next/server";

import { getGrowthAiCapability } from "@/lib/ai/growth-ai";
import { db } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const growthAi = getGrowthAiCapability();
  let database: "available" | "unavailable" = "available";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "unavailable";
  }

  return NextResponse.json(
    {
      status: database === "available" ? "ok" : "degraded",
      application: "kanni",
      database,
      ai: {
        available: growthAi.available,
        provider: growthAi.provider,
      },
    },
    {
      status: database === "available" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
