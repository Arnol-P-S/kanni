import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ADULT_GATE_COOKIE,
  ADULT_GATE_TTL_SECONDS,
  createAdultGateToken,
  getAdultGateSecret,
} from "@/lib/adult-gate";
import { getAiCapability } from "@/lib/ai/capability";

const AdultGateBodySchema = z.object({ confirmed: z.literal(true) });

export async function POST(request: Request): Promise<NextResponse> {
  const capability = getAiCapability();
  if (!capability.available) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supervised AI is disabled for this release.",
        capability,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const secret = getAdultGateSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Adult-gate configuration is unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    AdultGateBodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Explicit adult confirmation is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      expiresInSeconds: ADULT_GATE_TTL_SECONDS,
      capability,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set({
    name: ADULT_GATE_COOKIE,
    value: createAdultGateToken(secret),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADULT_GATE_TTL_SECONDS,
  });
  return response;
}
