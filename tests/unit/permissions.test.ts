import { SchoolRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { roleCan, roleCanSee } from "@/lib/permissions";

describe("school role policy", () => {
  it("gives school operations to the correct role", () => {
    expect(roleCan(SchoolRole.school_admin, "manage_people")).toBe(true);
    expect(roleCan(SchoolRole.school_admin, "manage_curriculum")).toBe(true);
    expect(roleCan(SchoolRole.school_admin, "review_work")).toBe(false);
    expect(roleCan(SchoolRole.teacher, "draft_with_ai")).toBe(true);
    expect(roleCan(SchoolRole.teacher, "edit_studio_plan")).toBe(true);
    expect(roleCan(SchoolRole.teacher, "submit_work")).toBe(false);
    expect(roleCan(SchoolRole.student, "request_student_help")).toBe(true);
    expect(roleCan(SchoolRole.student, "manage_curriculum")).toBe(false);
    expect(roleCan(SchoolRole.student, "submit_work")).toBe(true);
    expect(roleCan(SchoolRole.parent, "edit_family_response")).toBe(true);
    expect(roleCan(SchoolRole.parent, "respond_to_family_activity")).toBe(true);
  });

  it("keeps raw learner work between the assigned learner and teacher", () => {
    expect(roleCanSee(SchoolRole.teacher, "student_raw_work")).toBe(true);
    expect(roleCanSee(SchoolRole.student, "student_raw_work")).toBe(true);
    expect(roleCanSee(SchoolRole.student, "student_ai_help")).toBe(true);
    expect(roleCanSee(SchoolRole.teacher, "student_ai_help")).toBe(true);
    expect(roleCanSee(SchoolRole.parent, "student_raw_work")).toBe(false);
    expect(roleCanSee(SchoolRole.parent, "student_ai_help")).toBe(false);
    expect(roleCanSee(SchoolRole.school_admin, "student_raw_work")).toBe(false);
    expect(roleCanSee(SchoolRole.parent, "family_activity")).toBe(true);
    expect(roleCanSee(SchoolRole.school_admin, "ai_usage_summary")).toBe(true);
  });
});
