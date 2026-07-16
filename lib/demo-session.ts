import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { DemoPersonaIdSchema, type DemoPersonaId } from "@/lib/demo-fixtures";
import { GrowthCycleSchema, type GrowthCycle } from "@/lib/growth-cycle";

export const DEMO_SESSION_COOKIE = "kanni_demo_session";
export const DEMO_WORKSPACE_COOKIE = "kanni_demo_workspace";
export const DEMO_SESSION_TTL_SECONDS = 2 * 60 * 60;

const DemoSessionPayloadSchema = z
  .object({
    version: z.literal(1),
    personaId: DemoPersonaIdSchema,
    adultConfirmed: z.literal(true),
    issuedAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().positive(),
  })
  .strict();
export type DemoSessionPayload = z.infer<typeof DemoSessionPayloadSchema>;

function sign(namespace: string, encoded: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${namespace}.${encoded}`)
    .digest("base64url");
}

function encodeSigned(
  namespace: string,
  value: unknown,
  secret: string,
): string {
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encoded}.${sign(namespace, encoded, secret)}`;
}

function decodeSigned(
  namespace: string,
  token: string | undefined,
  secret: string,
): unknown | null {
  if (!token) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  const expected = Buffer.from(sign(namespace, encoded, secret));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function createDemoSessionToken(
  personaId: DemoPersonaId,
  secret: string,
  now = new Date(),
): string {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return encodeSigned(
    "session",
    {
      version: 1,
      personaId,
      adultConfirmed: true,
      issuedAt,
      expiresAt: issuedAt + DEMO_SESSION_TTL_SECONDS,
    },
    secret,
  );
}

export function verifyDemoSessionToken(
  token: string | undefined,
  secret: string,
  now = new Date(),
): DemoSessionPayload | null {
  const parsed = DemoSessionPayloadSchema.safeParse(
    decodeSigned("session", token, secret),
  );
  if (!parsed.success) return null;
  if (parsed.data.expiresAt <= Math.floor(now.getTime() / 1000)) return null;
  return parsed.data;
}

export function createDemoWorkspaceToken(
  cycle: GrowthCycle,
  secret: string,
): string {
  return encodeSigned("workspace", GrowthCycleSchema.parse(cycle), secret);
}

export function verifyDemoWorkspaceToken(
  token: string | undefined,
  secret: string,
): GrowthCycle | null {
  const parsed = GrowthCycleSchema.safeParse(
    decodeSigned("workspace", token, secret),
  );
  return parsed.success ? parsed.data : null;
}

export function getDemoSessionSecret(): string | null {
  const configured =
    process.env.DEMO_SESSION_SECRET?.trim() ||
    process.env.ADULT_GATE_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV !== "production") {
    return "kanni-local-synthetic-demo-secret-change-me";
  }
  return null;
}
