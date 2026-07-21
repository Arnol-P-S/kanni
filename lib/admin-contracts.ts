import { z } from "zod";

const normalizedEmail = z
  .string()
  .trim()
  .max(320)
  .pipe(z.email())
  .transform((value) => value.toLowerCase());

export const CreateSchoolMemberSchema = z
  .object({
    displayName: z.string().trim().min(2).max(120),
    email: normalizedEmail,
    role: z.enum(["teacher", "student", "parent"]),
    locale: z.enum(["en", "ml"]),
    password: z
      .string()
      .min(12)
      .max(128)
      .regex(/[a-z]/u)
      .regex(/[A-Z]/u)
      .regex(/[0-9]/u),
  })
  .strict();

export const ConnectSupportCircleSchema = z
  .object({
    teacherMembershipId: z.string().trim().min(8).max(40),
    studentMembershipId: z.string().trim().min(8).max(40),
    guardianMembershipId: z.string().trim().min(8).max(40),
  })
  .strict();
