import { describe, expect, it } from "vitest";

import {
  createGrowthCycle,
  flagStudentDisagreement,
  mapSupportCircle,
  publishTeacherPlan,
  recordFamilyResponse,
  recordFirstAnswer,
  recordRevision,
  recordSupportUsed,
  reviewStudentEvidence,
  PROJECT_AUTHORED_SUPPORT,
} from "@/lib/growth-cycle";

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
    cycle = recordRevision(
      cycle,
      "one_half",
      "same_whole_more_equal_parts",
    );
    cycle = reviewStudentEvidence(cycle, "guided_questions");
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
    cycle = recordRevision(cycle, "one_half", "same_whole_more_equal_parts");
    cycle = reviewStudentEvidence(cycle, "explain_to_someone");
    cycle = recordFamilyResponse(cycle, "tried");
    expect(recordFamilyResponse(cycle, "contact_teacher")).toBe(cycle);
  });
});
