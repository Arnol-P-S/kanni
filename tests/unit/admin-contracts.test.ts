import { describe, expect, it } from "vitest";

import { ConnectSupportCircleSchema, CreateSchoolMemberSchema } from "@/lib/admin-contracts";

describe("school administration boundaries", () => {
  it("accepts only teacher, student, and parent account creation", () => {
    const base = {
      displayName: "Meera Joseph",
      email: "teacher@school.example",
      locale: "en",
      password: "TeacherPass2026",
    };
    expect(CreateSchoolMemberSchema.safeParse({ ...base, role: "teacher" }).success).toBe(true);
    expect(CreateSchoolMemberSchema.safeParse({ ...base, role: "school_admin" }).success).toBe(false);
  });

  it("requires all three support-circle references", () => {
    expect(ConnectSupportCircleSchema.safeParse({
      teacherMembershipId: "membership-teacher-1",
      studentMembershipId: "membership-student-1",
      guardianMembershipId: "membership-parent-1",
    }).success).toBe(true);
    expect(ConnectSupportCircleSchema.safeParse({
      teacherMembershipId: "membership-teacher-1",
      studentMembershipId: "membership-student-1",
      guardianMembershipId: "",
    }).success).toBe(false);
  });
});
