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
    expect(response.trust.humanReview).toBe("pending");
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
      validateCriticOutput({ result: "warning", issueCodes: ["invented"] }),
    ).toThrow(/unknown issue/);
  });
});
