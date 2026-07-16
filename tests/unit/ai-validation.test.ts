import { describe, expect, it } from "vitest";

import type { TutorRequest } from "@/lib/domain";
import {
  validateCriticOutput,
  validateModelOutput,
} from "@/lib/ai/validation";

const request: TutorRequest = {
  lessonId: "cs-linear-search",
  language: "en",
  mode: "custom_question",
  prompt: "What is linear search?",
  deepCheck: false,
};

const guidedRequest: TutorRequest = {
  lessonId: "math-add-within-10",
  language: "en",
  mode: "guided_hint",
  questionId: "math-join-2-3",
  selectedAnswerId: "math-join-2-3-answer-4",
  deepCheck: false,
};

const guidedOutput = {
  explanation: "Touch each circle once as you count.",
  steps: ["Count the first group.", "Join and count the next group."],
  hint: "Move one counter after you count it.",
  recommendedCheckId: "math-check-post-1",
  sourceSectionIds: ["math-add-objects"],
  possibleConfusionCode: "needs_counting_support",
};

describe("model output hydration", () => {
  it("hydrates a valid allowlisted answer", () => {
    const response = validateModelOutput(request, {
      explanation: "Linear search checks each item in order.",
      steps: ["Start at index 0.", "Stop after a match."],
      hint: null,
      recommendedCheckId: "cs-check-trace-1",
      sourceSectionIds: ["cs-linear-definition", "cs-linear-steps"],
      possibleConfusionCode: null,
    });

    expect(response.status).toBe("grounded");
    expect(response.trust.citationIdsValid).toBe(true);
    expect(response.trust.sourceMatched).toBe(false);
    expect(response.trust.contentOrigin).toBe("model_generated");
  });

  it("discards invented section, check, confusion, and critic IDs", () => {
    const base = {
      explanation: "A response.",
      steps: [],
      hint: null,
      recommendedCheckId: null,
      sourceSectionIds: ["invented-section"],
      possibleConfusionCode: null,
    };
    expect(() => validateModelOutput(request, base)).toThrow(/unknown lesson/);
    expect(() =>
      validateModelOutput(request, {
        ...base,
        sourceSectionIds: ["cs-linear-definition"],
        recommendedCheckId: "invented-check",
      }),
    ).toThrow(/unknown check/);
    expect(() =>
      validateModelOutput(request, {
        ...base,
        sourceSectionIds: ["cs-linear-definition"],
        possibleConfusionCode: "invented-confusion",
      }),
    ).toThrow(/unknown confusion/);
    expect(() =>
      validateCriticOutput("source", {
        result: "warning",
        issueCodes: ["invented"],
      }),
    ).toThrow(/unknown issue/);
  });

  it.each(["5", "five", "അഞ്ച്"])(
    "rejects a Class 1 hint that reveals the answer as %s",
    (answer) => {
      expect(() =>
        validateModelOutput(guidedRequest, {
          ...guidedOutput,
          explanation: `The answer is ${answer}.`,
        }),
      ).toThrow(/revealed the correct answer/);
    },
  );

  it("accepts a bounded Class 1 action hint without the answer", () => {
    expect(validateModelOutput(guidedRequest, guidedOutput).status).toBe(
      "grounded",
    );
  });

  it("requires the trusted focus section for a guided hint", () => {
    expect(() =>
      validateModelOutput(guidedRequest, {
        ...guidedOutput,
        sourceSectionIds: ["math-add-check"],
      }),
    ).toThrow(/required lesson section/);
  });

  it("rejects generated high-risk or personal content", () => {
    expect(() =>
      validateModelOutput(request, {
        ...guidedOutput,
        explanation: "I want to hurt myself.",
        recommendedCheckId: "cs-check-trace-1",
        sourceSectionIds: ["cs-linear-definition"],
        possibleConfusionCode: null,
      }),
    ).toThrow(/safety screen/);
    expect(() =>
      validateModelOutput(request, {
        ...guidedOutput,
        explanation: "Email child@example.com.",
        recommendedCheckId: "cs-check-trace-1",
        sourceSectionIds: ["cs-linear-definition"],
        possibleConfusionCode: null,
      }),
    ).toThrow(/safety screen/);
  });

  it("rejects generated content outside the selected lesson or advice boundary", () => {
    expect(() =>
      validateModelOutput(request, {
        explanation: "Binary search always finds an item in O(1) time.",
        steps: [],
        hint: null,
        recommendedCheckId: null,
        sourceSectionIds: ["cs-linear-definition"],
        possibleConfusionCode: null,
      }),
    ).toThrow(/outside the selected lesson boundary/);
    expect(() =>
      validateModelOutput(request, {
        explanation:
          "Linear search checks each item. You are smart, so choose the science stream.",
        steps: [],
        hint: null,
        recommendedCheckId: null,
        sourceSectionIds: ["cs-linear-definition"],
        possibleConfusionCode: null,
      }),
    ).toThrow(/outside the selected lesson boundary/);
  });

  it("strictly reparses provider output before returning it", () => {
    expect(() =>
      validateModelOutput(request, {
        explanation: "Linear search checks each item in order.",
        steps: [],
        hint: null,
        recommendedCheckId: null,
        sourceSectionIds: ["cs-linear-definition"],
        possibleConfusionCode: null,
        providerDebug: "must not cross the boundary",
      }),
    ).toThrow();
  });
});

describe("critic output validation", () => {
  it("accepts only issue codes for the requested critic kind", () => {
    expect(
      validateCriticOutput("source", {
        result: "warning",
        issueCodes: ["citation_mismatch"],
      }),
    ).toEqual({ result: "warning", issueCodes: ["citation_mismatch"] });
    expect(
      validateCriticOutput("teaching", {
        result: "warning",
        issueCodes: ["unclear_step"],
      }),
    ).toEqual({ result: "warning", issueCodes: ["unclear_step"] });
    expect(() =>
      validateCriticOutput("source", {
        result: "warning",
        issueCodes: ["unclear_step"],
      }),
    ).toThrow(/unknown issue/);
    expect(() =>
      validateCriticOutput("teaching", {
        result: "warning",
        issueCodes: ["citation_mismatch"],
      }),
    ).toThrow(/unknown issue/);
  });

  it("keeps pass and warning issue-list invariants", () => {
    expect(() =>
      validateCriticOutput("source", {
        result: "pass",
        issueCodes: ["missing_support"],
      }),
    ).toThrow(/passing critic/);
    expect(() =>
      validateCriticOutput("teaching", {
        result: "warning",
        issueCodes: [],
      }),
    ).toThrow(/warning critic/);
  });

  it("strictly reparses critic output", () => {
    expect(() =>
      validateCriticOutput("source", {
        result: "pass",
        issueCodes: [],
        providerDebug: "must not cross the boundary",
      }),
    ).toThrow();
  });
});
