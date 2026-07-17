import { describe, expect, it } from "vitest";

import {
  createGrowthCycle,
  flagStudentDisagreement,
  mapSupportCircle,
  publishTeacherPlan,
  recordFamilyResponse,
  recordFirstAnswer,
  recordMakerArtifact,
  recordRevision,
  recordSupportUsed,
  reviewStudentEvidence,
  PROJECT_AUTHORED_SUPPORT,
} from "@/lib/growth-cycle";

const makerSubmission = {
  makerPath: "fair_share_plan",
  artifactDraft:
    "I divided two equal paper snacks into halves and quarters for a fair sharing plan.",
  artifactCritique: "whole_size_unclear",
  artifactRevision:
    "I marked both paper snacks as the same size before dividing and added labels to each equal part.",
} as const;

describe("GrowthCycle transitions", () => {
  it("connects admin mapping, teacher publication, student evidence, review, and family response", () => {
    let cycle = createGrowthCycle();
    cycle = mapSupportCircle(cycle, "ml");
    cycle = publishTeacherPlan(cycle, "fraction_strips");
    cycle = recordFirstAnswer(cycle, "one_quarter");
    cycle = recordSupportUsed(
      cycle,
      PROJECT_AUTHORED_SUPPORT,
      "project_authored",
    );
    cycle = recordMakerArtifact(cycle, makerSubmission);
    cycle = recordRevision(
      cycle,
      "one_half",
      "same_whole_more_equal_parts",
    );
    cycle = reviewStudentEvidence(cycle, "guided_questions", "light");
    cycle = recordFamilyResponse(cycle, "tried");

    expect(cycle.plan.status).toBe("published");
    expect(cycle.student.firstAnswer).toBe("one_quarter");
    expect(cycle.student.revisedAnswer).toBe("one_half");
    expect(cycle.teacherReview.nextSupport).toBe("guided_questions");
    expect(cycle.family.response).toBe("tried");
  });

  it("rejects publication before mapping and family access before review", () => {
    const cycle = createGrowthCycle();
    expect(() => publishTeacherPlan(cycle, "fraction_strips")).toThrow(
      /support circle/i,
    );
    expect(() => recordFamilyResponse(cycle, "tried")).toThrow(
      /approve the family brief/i,
    );
  });

  it("rejects a revision or record challenge before the required evidence", () => {
    let cycle = mapSupportCircle(createGrowthCycle(), "en");
    cycle = publishTeacherPlan(cycle, "guided_questions");
    cycle = recordFirstAnswer(cycle, "one_quarter");
    expect(() =>
      recordRevision(cycle, "one_half", "same_whole_more_equal_parts"),
    ).toThrow(/support must be opened/i);
    expect(() => flagStudentDisagreement(cycle)).toThrow(/completed evidence/i);
  });

  it("makes published and completed handoffs one-shot", () => {
    let cycle = mapSupportCircle(createGrowthCycle(), "en");
    cycle = publishTeacherPlan(cycle, "guided_questions");
    expect(publishTeacherPlan(cycle, "fraction_strips")).toBe(cycle);
    cycle = recordFirstAnswer(cycle, "one_quarter");
    cycle = recordSupportUsed(
      cycle,
      PROJECT_AUTHORED_SUPPORT,
      "project_authored",
    );
    expect(
      recordSupportUsed(cycle, PROJECT_AUTHORED_SUPPORT, "project_authored"),
    ).toBe(cycle);
    cycle = recordMakerArtifact(cycle, makerSubmission);
    cycle = recordRevision(cycle, "one_half", "same_whole_more_equal_parts");
    cycle = reviewStudentEvidence(cycle, "explain_to_someone", "independent");
    cycle = recordFamilyResponse(cycle, "tried");
    expect(recordFamilyResponse(cycle, "contact_teacher")).toBe(cycle);
  });

  it("requires a private create, critique, revise artifact before evidence", () => {
    let cycle = mapSupportCircle(createGrowthCycle(), "en");
    cycle = publishTeacherPlan(cycle, "fraction_strips");
    cycle = recordFirstAnswer(cycle, "one_quarter");
    cycle = recordSupportUsed(
      cycle,
      PROJECT_AUTHORED_SUPPORT,
      "project_authored",
    );
    expect(() =>
      recordRevision(cycle, "one_half", "same_whole_more_equal_parts"),
    ).toThrow(/create, critique, and revise/i);
    expect(() =>
      recordMakerArtifact(cycle, {
        ...makerSubmission,
        artifactDraft: "Email me at learner@example.com with my plan.",
      }),
    ).toThrow(/email addresses/i);
  });
});
