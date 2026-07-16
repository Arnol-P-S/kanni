import { createHmac, timingSafeEqual } from "node:crypto";

export const ADULT_GATE_COOKIE = "kanni_adult_gate";
export const ADULT_GATE_TTL_SECONDS = 30 * 60;

type AdultGatePayload = {
  version: 1;
  expiresAt: number;
};

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAdultGateToken(
  secret: string,
  now = new Date(),
): string {
  const payload: AdultGatePayload = {
    version: 1,
    expiresAt: Math.floor(now.getTime() / 1000) + ADULT_GATE_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyAdultGateToken(
  token: string | undefined,
  secret: string,
  now = new Date(),
): boolean {
  if (!token) return false;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return false;

  const expected = sign(encoded, secret);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as AdultGatePayload;
    return (
      payload.version === 1 &&
      Number.isInteger(payload.expiresAt) &&
      payload.expiresAt > Math.floor(now.getTime() / 1000)
    );
  } catch {
    return false;
  }
}

export function getAdultGateSecret(): string | null {
  return process.env.ADULT_GATE_SECRET?.trim() || null;
}
