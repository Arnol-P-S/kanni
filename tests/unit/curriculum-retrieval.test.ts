import { describe, expect, it } from "vitest";

import {
  citationsMatchRetrievedSections,
  retrieveCurriculumSections,
} from "@/lib/curriculum/fractions-foundation";

describe("reviewed curriculum retrieval", () => {
  it("retrieves the lesson goal, misconceptions, and family bridge for teacher planning", () => {
    const sections = retrieveCurriculumSections(
      "plan a fractions lesson with likely misconceptions, a quick check, and a family activity",
      4,
    );

    expect(sections.map((section) => section.id)).toEqual(
      expect.arrayContaining([
        "fractions-goal",
        "fractions-misconceptions",
        "fractions-home",
      ]),
    );
    expect(sections.every((section) => section.rightsBasis === "original")).toBe(
      true,
    );
    expect(sections.every((section) => section.reviewedAt !== null)).toBe(true);
  });

  it("retrieves only the relevant comparison sections for a guided student scaffold", () => {
    const sections = retrieveCurriculumSections(
      "ask guided questions about equal wholes, halves, quarters, and the space one part takes",
      2,
    );

    expect(sections.map((section) => section.id)).toEqual([
      "fractions-visual",
      "fractions-goal",
    ]);
  });

  it("returns no curriculum for an unrelated request", () => {
    expect(
      retrieveCurriculumSections(
        "recommend a career and rank this learner against the class",
      ),
    ).toEqual([]);
  });

  it("rejects a citation that was not present in retrieved context", () => {
    const sections = retrieveCurriculumSections("compare fraction strips", 1);

    expect(citationsMatchRetrievedSections(["fractions-visual"], sections)).toBe(
      true,
    );
    expect(citationsMatchRetrievedSections(["fractions-home"], sections)).toBe(
      false,
    );
  });
});
