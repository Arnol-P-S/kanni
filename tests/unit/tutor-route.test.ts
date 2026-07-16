import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAdultGateToken } from "@/lib/adult-gate";

const generateText = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("ai", () => ({
  generateText,
  Output: { object: ({ schema }: { schema: unknown }) => ({ schema }) },
}));

const secret = "route-test-secret-long-enough";

function tutorRequest(
  body: Record<string, unknown>,
  options: { adultGate?: boolean } = { adultGate: true },
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options.adultGate) {
    headers.set(
      "Cookie",
      `kanni_adult_gate=${createAdultGateToken(secret)}`,
    );
  }
  return new NextRequest("http://localhost/api/tutor", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  lessonId: "cs-linear-search",
  language: "en",
  mode: "custom_question",
  prompt: "What is linear search?",
  deepCheck: false,
};

const validOutput = {
  explanation: "Linear search checks items in order.",
  steps: ["Start at the first item."],
  hint: null,
  recommendedCheckId: "cs-check-trace-1",
  sourceSectionIds: ["cs-linear-definition"],
  possibleConfusionCode: null,
};

describe("POST /api/tutor", () => {
  beforeEach(() => {
    vi.resetModules();
    generateText.mockReset();
    process.env.ADULT_GATE_SECRET = secret;
    process.env.AI_DEMO_ENABLED = "true";
    process.env.AI_GATEWAY_API_KEY = "test-key";
  });

  it("requires the adult-gate cookie", async () => {
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validBody, { adultGate: false }));
    expect(response.status).toBe(401);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("routes personal data without calling the model", async () => {
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(
      tutorRequest({
        ...validBody,
        prompt: "My name is Arun and my phone is 9876543210. Explain linear search.",
      }),
    );
    expect((await response.json()).status).toBe("unsupported");
    expect(generateText).not.toHaveBeenCalled();
  });

  it("returns a validated grounded answer", async () => {
    generateText.mockResolvedValueOnce({ output: validOutput });
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validBody));
    const body = await response.json();
    expect(body.status).toBe("grounded");
    expect(body.sourceSectionIds).toEqual(["cs-linear-definition"]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each([
    new Error("timeout"),
    new Error("HTTP 402"),
    new Error("HTTP 429"),
    new Error("provider refusal"),
  ])("hides provider failures: %s", async (providerError) => {
    generateText.mockRejectedValueOnce(providerError);
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validBody));
    expect((await response.json()).status).toBe("unavailable");
  });

  it("hides malformed or invented citations", async () => {
    generateText.mockResolvedValueOnce({
      output: { ...validOutput, sourceSectionIds: ["invented"] },
    });
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validBody));
    expect((await response.json()).status).toBe("unavailable");
  });

  it("keeps a grounded answer when one Deep Check critic fails", async () => {
    generateText
      .mockResolvedValueOnce({ output: validOutput })
      .mockRejectedValueOnce(new Error("critic timeout"))
      .mockResolvedValueOnce({ output: { result: "pass", issueCodes: [] } });
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest({ ...validBody, deepCheck: true }));
    const body = await response.json();
    expect(body.status).toBe("grounded");
    expect(body.deepCheck).toEqual({
      sourceCritic: "unavailable",
      teachingCritic: "pass",
      issueCodes: [],
    });
  });
});
