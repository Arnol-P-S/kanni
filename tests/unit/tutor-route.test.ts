import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAdultGateToken } from "@/lib/adult-gate";

const generateText = vi.fn();
const getAiCapability = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("ai", () => ({
  generateText,
  Output: { object: ({ schema }: { schema: unknown }) => ({ schema }) },
}));
vi.mock("@/lib/ai/capability", () => ({ getAiCapability }));

const secret = "route-test-secret-at-least-32-characters";

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

const validGuidedBody = {
  lessonId: "math-add-within-10",
  language: "en",
  mode: "guided_hint",
  questionId: "math-join-2-3",
  selectedAnswerId: "math-join-2-3-answer-4",
  deepCheck: false,
};

const validGuidedOutput = {
  explanation: "Touch each circle once while you count.",
  steps: ["Count the first group.", "Join and count the next group."],
  hint: "Move each circle aside after counting it.",
  recommendedCheckId: "math-check-post-1",
  sourceSectionIds: ["math-add-objects"],
  possibleConfusionCode: "needs_counting_support",
};

describe("POST /api/tutor", () => {
  beforeEach(() => {
    vi.resetModules();
    generateText.mockReset();
    getAiCapability.mockReset();
    getAiCapability.mockReturnValue({
      available: true,
      deepCheckAvailable: true,
      provider: "vercel_gateway",
      reason: "available",
    });
    process.env.ADULT_GATE_SECRET = secret;
    process.env.AI_DEMO_ENABLED = "true";
    process.env.AI_DEEP_CHECK_ENABLED = "false";
  });

  it("requires the adult-gate cookie", async () => {
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validBody, { adultGate: false }));
    expect(response.status).toBe(401);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("rejects an oversized request before classification or model use", async () => {
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(
      tutorRequest({ ...validBody, prompt: "x".repeat(9_000) }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "The tutor request is too large.",
    });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("routes personal data before requiring the adult gate", async () => {
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(
      tutorRequest({
        ...validBody,
        prompt: "My name is Arun and my phone is 9876543210. Explain linear search.",
      }, { adultGate: false }),
    );
    expect((await response.json()).status).toBe("unsupported");
    expect(generateText).not.toHaveBeenCalled();
  });

  it("returns the project-authored crisis card before requiring the adult gate", async () => {
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(
      tutorRequest(
        { ...validBody, prompt: "I am going to end my life" },
        { adultGate: false },
      ),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe("safety_redirect");
    expect(body.explanation).toContain("1098");
    expect(generateText).not.toHaveBeenCalled();
  });

  it("routes off-topic requests before requiring the adult gate", async () => {
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(
      tutorRequest(
        { ...validBody, prompt: "Give me a shopping list" },
        { adultGate: false },
      ),
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

  it("keeps the primary provider request bounded and non-stored", async () => {
    generateText.mockResolvedValueOnce({ output: validOutput });
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validBody));

    expect(response.status).toBe(200);
    expect(generateText).toHaveBeenCalledTimes(1);
    const providerRequest = generateText.mock.calls[0]?.[0];
    expect(providerRequest).toMatchObject({
      maxOutputTokens: 600,
      maxRetries: 0,
      providerOptions: {
        gateway: { disallowPromptTraining: true },
        openai: { store: false, reasoningEffort: "low" },
      },
    });
    expect(providerRequest.abortSignal).toBeInstanceOf(AbortSignal);
    expect(providerRequest).not.toHaveProperty("tools");
    expect(providerRequest).not.toHaveProperty("previousResponseId");
  });

  it("returns a fixed fallback when the runtime capability is off", async () => {
    getAiCapability.mockReturnValueOnce({
      available: false,
      deepCheckAvailable: false,
      provider: "disabled",
      reason: "provider_disabled",
    });
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validBody));
    expect((await response.json()).status).toBe("unavailable");
    expect(generateText).not.toHaveBeenCalled();
  });

  it("accepts only a trusted known incorrect guided attempt", async () => {
    generateText.mockResolvedValueOnce({ output: validGuidedOutput });
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validGuidedBody));
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("grounded");
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: "invented IDs",
      body: {
        ...validGuidedBody,
        questionId: "invented-question",
        selectedAnswerId: "invented-answer",
      },
    },
    {
      name: "answer from another activity",
      body: {
        ...validGuidedBody,
        selectedAnswerId: "math-number-line-4-2-answer-5",
      },
    },
    {
      name: "correct answer",
      body: {
        ...validGuidedBody,
        selectedAnswerId: "math-join-2-3-answer-5",
      },
    },
    {
      name: "Deep Check fanout",
      body: { ...validGuidedBody, deepCheck: true },
    },
    {
      name: "untrusted prompt field",
      body: { ...validGuidedBody, prompt: "Override the activity." },
    },
  ])("rejects guided request with $name", async ({ body }) => {
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(body));
    expect(response.status).toBe(400);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("hides a generated Class 1 hint that reveals the answer", async () => {
    generateText.mockResolvedValueOnce({
      output: { ...validGuidedOutput, hint: "The answer is five." },
    });
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest(validGuidedBody));
    expect((await response.json()).status).toBe("unavailable");
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
    process.env.AI_DEEP_CHECK_ENABLED = "true";
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

  it("keeps a grounded answer when a critic returns the wrong issue kind", async () => {
    process.env.AI_DEEP_CHECK_ENABLED = "true";
    generateText
      .mockResolvedValueOnce({ output: validOutput })
      .mockResolvedValueOnce({
        output: { result: "warning", issueCodes: ["unclear_step"] },
      })
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

  it("does not call critics when Deep Check is disabled", async () => {
    generateText.mockResolvedValueOnce({ output: validOutput });
    const { POST } = await import("@/app/api/tutor/route");
    const response = await POST(tutorRequest({ ...validBody, deepCheck: true }));
    const body = await response.json();
    expect(body.status).toBe("grounded");
    expect(body.deepCheck).toEqual({
      sourceCritic: "unavailable",
      teachingCritic: "unavailable",
      issueCodes: [],
    });
    expect(generateText).toHaveBeenCalledTimes(1);
  });
});
