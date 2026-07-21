import { describe, expect, it } from "vitest";

import { SchoolSetupSchema } from "@/lib/setup-contracts";

const valid = {
  schoolName: "Riverbank School",
  adminName: "Anjali Menon",
  email: "admin@riverbank.example",
  locale: "en",
  password: "StrongSchool2026",
  confirmPassword: "StrongSchool2026",
};

describe("first-run school setup", () => {
  it("accepts a complete administrator setup", () => {
    expect(SchoolSetupSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a strong matching password", () => {
    expect(SchoolSetupSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" }).success).toBe(false);
    expect(SchoolSetupSchema.safeParse({ ...valid, confirmPassword: "Different2026" }).success).toBe(false);
  });

  it("normalizes the administrator email", () => {
    const result = SchoolSetupSchema.parse({ ...valid, email: " Admin@Riverbank.Example " });
    expect(result.email).toBe("admin@riverbank.example");
  });
});
