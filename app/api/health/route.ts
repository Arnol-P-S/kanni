import { NextResponse } from "next/server";

export function GET(): NextResponse {
  const aiEnabled = process.env.AI_DEMO_ENABLED === "true";
  const gatewayKeyConfigured = Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim(),
  );
  const adultGateConfigured = Boolean(process.env.ADULT_GATE_SECRET?.trim());

  return NextResponse.json(
    {
      status: "ok",
      application: "kanni",
      ai: {
        enabled: aiEnabled,
        gatewayKeyConfigured,
        adultGateConfigured,
        primaryModel:
          process.env.AI_PRIMARY_MODEL || "openai/gpt-5.6-sol",
        criticModel:
          process.env.AI_CRITIC_MODEL || "openai/gpt-5.6-luna",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
