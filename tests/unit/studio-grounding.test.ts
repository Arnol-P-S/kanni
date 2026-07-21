import { describe, expect, it } from "vitest";

import { splitCurriculumIntoSections } from "@/lib/curriculum/rag";
import {
  teacherPlanCitationsAreValid,
  teacherPlanIsSafeForReview,
} from "@/lib/studio/grounding";
import { createTeacherStarterPlan } from "@/lib/studio/plan";

const sections = splitCurriculumIntoSections(`
Claims and evidence
A useful claim needs relevant evidence. Explain how the evidence supports the claim and revise when the evidence does not fit.

Testing
Start with a prediction, test it with an example, and compare the result with the prediction.
`);

describe("teacher plan grounding", () => {
  it("accepts a plan whose nested citations all belong to the source", () => {
    const plan = createTeacherStarterPlan({
      goal: "Test a claim and revise it when the curriculum evidence does not support it.",
      drivingQuestion: "How does evidence help us decide whether to keep a claim?",
      familyLocale: "en",
      sections,
    });
    expect(teacherPlanCitationsAreValid(plan, sections)).toBe(true);
  });

  it("rejects an invented nested source ID", () => {
    const plan = createTeacherStarterPlan({
      goal: "Test a claim and revise it when the curriculum evidence does not support it.",
      drivingQuestion: "How does evidence help us decide whether to keep a claim?",
      familyLocale: "en",
      sections,
    });
    plan.quickChecks[0].sourceSectionIds = ["SEC-999"];
    expect(teacherPlanCitationsAreValid(plan, sections)).toBe(false);
  });

  it("rejects generated contact details and diagnostic labels before review", () => {
    const plan = createTeacherStarterPlan({
      goal: "Test a claim and revise it when the curriculum evidence does not support it.",
      drivingQuestion: "How does evidence help us decide whether to keep a claim?",
      familyLocale: "en",
      sections,
    });

    plan.overview = "Ask the teacher to email learner@example.com before continuing.";
    expect(teacherPlanIsSafeForReview(plan)).toBe(false);

    plan.overview = "This weak student is not intelligent enough for the extension.";
    expect(teacherPlanIsSafeForReview(plan)).toBe(false);

    plan.overview = "Use the evidence, then revise the weakest claim.\uFFFC\uFFFC";
    expect(teacherPlanIsSafeForReview(plan)).toBe(false);

    plan.overview = "അളവ് പരിശോധിച്ച് തെളിവ് വിശദീകരിക്കുക.";
    expect(teacherPlanIsSafeForReview(plan)).toBe(true);

    plan.overview = "A".repeat(320);
    expect(teacherPlanIsSafeForReview(plan)).toBe(false);
  });
});
