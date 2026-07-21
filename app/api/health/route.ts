import { NextResponse } from "next/server";

import {
  getStudentStudioAiCapability,
  getStudioAiCapability,
} from "@/lib/ai/studio-ai";
import { db } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const studioAi = getStudioAiCapability();
  const studentAi = getStudentStudioAiCapability();
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
        available: studioAi.available,
        provider: studioAi.provider,
        studentHelpAvailable: studentAi.available,
      },
    },
    {
      status: database === "available" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
