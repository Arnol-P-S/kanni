"use server";

import { createHash, randomBytes } from "node:crypto";
import { Locale, Prisma, SchoolRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

import { loginWithPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { SchoolSetupSchema } from "@/lib/setup-contracts";

export type SetupState = {
  status: "idle" | "error";
  message?: string;
  fields?: {
    schoolName?: string;
    adminName?: string;
    email?: string;
    locale?: "en" | "ml";
  };
  fieldErrors?: Record<string, string[]>;
};

function slugForSchool(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 55) || "school";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export async function setupSchoolAction(
  _previousState: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const raw = {
    schoolName: formData.get("schoolName"),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    locale: formData.get("locale"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };
  const parsed = SchoolSetupSchema.safeParse(raw);
  const fields = {
    schoolName: String(raw.schoolName ?? ""),
    adminName: String(raw.adminName ?? ""),
    email: String(raw.email ?? ""),
    locale: raw.locale === "ml" ? ("ml" as const) : ("en" as const),
  };
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fields,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (await db.school.findFirst({ select: { id: true } })) {
    return {
      status: "error",
      message: "This Kanni installation already has a school. Sign in instead.",
      fields,
    };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  try {
    await db.$transaction(
      async (transaction) => {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(1262564942)`;
        if (await transaction.school.findFirst({ select: { id: true } })) {
          throw new Error("installation-already-configured");
        }

        const school = await transaction.school.create({
          data: {
            slug: slugForSchool(parsed.data.schoolName),
            name: parsed.data.schoolName,
          },
        });
        const user = await transaction.user.create({
          data: {
            email: parsed.data.email,
            displayName: parsed.data.adminName,
            passwordHash,
            locale: parsed.data.locale === "ml" ? Locale.ml : Locale.en,
          },
        });
        const membership = await transaction.membership.create({
          data: {
            schoolId: school.id,
            userId: user.id,
            role: SchoolRole.school_admin,
          },
        });
        await transaction.auditEvent.create({
          data: {
            schoolId: school.id,
            actorUserId: user.id,
            action: "installation.school_created",
            entityType: "school",
            entityId: school.id,
            metadata: {
              administratorMembershipHash: createHash("sha256")
                .update(membership.id)
                .digest("hex"),
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "installation-already-configured") {
      return {
        status: "error",
        message: "This Kanni installation already has a school. Sign in instead.",
        fields,
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "That email is already in use.",
        fields,
        fieldErrors: { email: ["Use another email address."] },
      };
    }
    return {
      status: "error",
      message: "School setup could not finish. Please try again.",
      fields,
    };
  }

  let destination = "/login?notice=school-created";
  try {
    const actor = await loginWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    destination = `/portal/${actor.role === SchoolRole.school_admin ? "admin" : actor.role}`;
  } catch {}
  redirect(destination);
}
