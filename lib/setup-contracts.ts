import { z } from "zod";

export const SchoolSetupSchema = z
  .object({
    schoolName: z.string().trim().min(3).max(160),
    adminName: z.string().trim().min(2).max(120),
    email: z
      .string()
      .trim()
      .max(320)
      .pipe(z.email())
      .transform((value) => value.toLowerCase()),
    locale: z.enum(["en", "ml"]),
    password: z
      .string()
      .min(12)
      .max(128)
      .regex(/[a-z]/u, "Use at least one lowercase letter.")
      .regex(/[A-Z]/u, "Use at least one uppercase letter.")
      .regex(/[0-9]/u, "Use at least one number."),
    confirmPassword: z.string().min(1).max(128),
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SchoolSetupInput = z.infer<typeof SchoolSetupSchema>;
