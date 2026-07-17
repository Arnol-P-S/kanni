import { SchoolRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { roleCan, roleCanSee } from "@/lib/permissions";

describe("school role policy", () => {
  it("grants each role only its workflow capabilities", () => {
    expect(roleCan(SchoolRole.school_admin, "manage_school")).toBe(true);
    expect(roleCan(SchoolRole.school_admin, "review_evidence")).toBe(false);
    expect(roleCan(SchoolRole.teacher, "review_evidence")).toBe(true);
    expect(roleCan(SchoolRole.teacher, "submit_evidence")).toBe(false);
    expect(roleCan(SchoolRole.student, "submit_evidence")).toBe(true);
    expect(roleCan(SchoolRole.student, "plan_instruction")).toBe(false);
    expect(roleCan(SchoolRole.parent, "respond_to_family_activity")).toBe(true);
    expect(roleCan(SchoolRole.parent, "review_evidence")).toBe(false);
  });

  it("keeps student evidence out of the parent and administrator views", () => {
    expect(roleCanSee(SchoolRole.teacher, "student_evidence")).toBe(true);
    expect(roleCanSee(SchoolRole.student, "student_evidence")).toBe(true);
    expect(roleCanSee(SchoolRole.parent, "student_evidence")).toBe(false);
    expect(roleCanSee(SchoolRole.school_admin, "student_evidence")).toBe(false);
    expect(roleCanSee(SchoolRole.teacher, "student_artifact")).toBe(true);
    expect(roleCanSee(SchoolRole.student, "student_artifact")).toBe(true);
    expect(roleCanSee(SchoolRole.parent, "student_artifact")).toBe(false);
    expect(roleCanSee(SchoolRole.school_admin, "student_artifact")).toBe(false);
  });
});
