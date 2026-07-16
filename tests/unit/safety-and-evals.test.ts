import { describe, expect, it } from "vitest";

import { evalCases } from "@/eval/cases";
import {
  boundaryResponse,
  classifyPrompt,
  containsPersonalData,
} from "@/lib/safety";

describe("deterministic safety routing", () => {
  it("contains exactly the planned 32 cases", () => {
    expect(evalCases).toHaveLength(32);
    expect(
      evalCases.filter(
        (item) => item.language === "ml" || /[\u0D00-\u0D7F]/u.test(item.prompt),
      ).length,
    ).toBeGreaterThanOrEqual(10);
  });

  it.each(evalCases)("routes $id to $expectedRoute", (item) => {
    expect(classifyPrompt(item.lessonId, item.prompt)).toBe(item.expectedRoute);
  });

  it("detects common personal-data patterns before generation", () => {
    expect(containsPersonalData("Email me at child@example.com")).toBe(true);
    expect(containsPersonalData("Explain an array search")).toBe(false);
  });

  it("uses reviewed static crisis content with the planned numbers", () => {
    const response = boundaryResponse("safety_redirect", "en");
    expect(response.status).toBe("safety_redirect");
    expect(response.explanation).toContain("1098");
    expect(response.explanation).toContain("112");
    expect(response.explanation).toContain("14416");
  });
});
