"use server";

import { createHash } from "node:crypto";
import {
  CurriculumStatus,
  Locale,
  Prisma,
  RightsBasis,
  SchoolRole,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ConnectSupportCircleSchema,
  CreateSchoolMemberSchema,
} from "@/lib/admin-contracts";
import { requireActor } from "@/lib/auth";
import {
  normalizeCurriculumText,
  sourceNeedsLinkOnlyTreatment,
  splitCurriculumIntoSections,
} from "@/lib/curriculum/rag";
import { db } from "@/lib/db";
import { inspectTextFields } from "@/lib/safety/input-guard";
import { CurriculumPackInputSchema } from "@/lib/studio/contracts";

export type AdminFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createSchoolMemberAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireActor(SchoolRole.school_admin);
  const parsed = CreateSchoolMemberSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    role: formData.get("role"),
    locale: formData.get("locale"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the account details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  try {
    await db.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          displayName: parsed.data.displayName,
          email: parsed.data.email,
          passwordHash,
          locale: parsed.data.locale === "ml" ? Locale.ml : Locale.en,
        },
      });
      const membership = await transaction.membership.create({
        data: {
          schoolId: actor.schoolId,
          userId: user.id,
          role: parsed.data.role as SchoolRole,
        },
      });
      await transaction.auditEvent.create({
        data: {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "school.member_created",
          entityType: "membership",
          entityId: membership.id,
          metadata: { role: parsed.data.role },
        },
      });
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "That email already belongs to an account.",
        fieldErrors: { email: ["Use another email address."] },
      };
    }
    return { status: "error", message: "The account could not be created." };
  }

  revalidatePath("/portal/admin");
  return {
    status: "success",
    message: `${parsed.data.displayName} can now sign in as ${parsed.data.role}.`,
  };
}

export async function connectSupportCircleAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireActor(SchoolRole.school_admin);
  const parsed = ConnectSupportCircleSchema.safeParse({
    teacherMembershipId: formData.get("teacherMembershipId"),
    studentMembershipId: formData.get("studentMembershipId"),
    guardianMembershipId: formData.get("guardianMembershipId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Choose one teacher, student, and parent." };
  }

  const memberships = await db.membership.findMany({
    where: {
      schoolId: actor.schoolId,
      isActive: true,
      id: {
        in: [
          parsed.data.teacherMembershipId,
          parsed.data.studentMembershipId,
          parsed.data.guardianMembershipId,
        ],
      },
    },
    select: { id: true, role: true },
  });
  const rolesById = new Map(memberships.map((membership) => [membership.id, membership.role]));
  if (
    rolesById.get(parsed.data.teacherMembershipId) !== SchoolRole.teacher ||
    rolesById.get(parsed.data.studentMembershipId) !== SchoolRole.student ||
    rolesById.get(parsed.data.guardianMembershipId) !== SchoolRole.parent
  ) {
    return { status: "error", message: "One of those accounts is not available in this school." };
  }

  await db.$transaction(async (transaction) => {
    await transaction.teacherStudent.upsert({
      where: {
        teacherMembershipId_studentMembershipId: {
          teacherMembershipId: parsed.data.teacherMembershipId,
          studentMembershipId: parsed.data.studentMembershipId,
        },
      },
      update: {},
      create: {
        teacherMembershipId: parsed.data.teacherMembershipId,
        studentMembershipId: parsed.data.studentMembershipId,
      },
    });
    await transaction.guardianStudent.upsert({
      where: {
        guardianMembershipId_studentMembershipId: {
          guardianMembershipId: parsed.data.guardianMembershipId,
          studentMembershipId: parsed.data.studentMembershipId,
        },
      },
      update: {},
      create: {
        guardianMembershipId: parsed.data.guardianMembershipId,
        studentMembershipId: parsed.data.studentMembershipId,
      },
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "school.support_circle_connected",
        entityType: "membership_mapping",
        entityId: parsed.data.studentMembershipId,
        metadata: {
          teacherMembershipId: parsed.data.teacherMembershipId,
          guardianMembershipId: parsed.data.guardianMembershipId,
        },
      },
    });
  });

  revalidatePath("/portal/admin");
  revalidatePath("/portal/teacher");
  return { status: "success", message: "The support circle is connected." };
}

export async function createCurriculumPackAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireActor(SchoolRole.school_admin);
  const parsed = CurriculumPackInputSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject"),
    gradeLabel: formData.get("gradeLabel"),
    version: formData.get("version"),
    rightsBasis: formData.get("rightsBasis"),
    sourceUrl: formData.get("sourceUrl") ?? "",
    sourceText: formData.get("sourceText"),
    locale: formData.get("locale"),
    rightsConfirmed: formData.get("rightsConfirmed"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the curriculum details and permission confirmation.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  if (sourceNeedsLinkOnlyTreatment(parsed.data.sourceUrl || null)) {
    return {
      status: "error",
      message: "SCERT-hosted material must remain link-only. Add original or permission-safe school notes instead.",
      fieldErrors: { sourceUrl: ["This source cannot be copied into Kanni."] },
    };
  }
  const guarded = inspectTextFields([
    parsed.data.title,
    parsed.data.subject,
    parsed.data.sourceText,
  ]);
  if (guarded.status !== "clear") {
    return {
      status: "error",
      message:
        guarded.status === "personal_data"
          ? "Remove contact details and web addresses from the curriculum text."
          : "The curriculum text contains a high-risk or unsafe instruction.",
    };
  }

  const normalizedSource = normalizeCurriculumText(parsed.data.sourceText);
  const sections = splitCurriculumIntoSections(normalizedSource);
  if (sections.length === 0) {
    return { status: "error", message: "Kanni could not divide this source into usable sections." };
  }
  const checksum = createHash("sha256").update(normalizedSource).digest("hex");
  const duplicate = await db.curriculumPack.findFirst({
    where: {
      schoolId: actor.schoolId,
      title: parsed.data.title,
      version: parsed.data.version,
      checksum,
    },
    select: { id: true },
  });
  if (duplicate) {
    return { status: "error", message: "This exact title, version, and content already exists." };
  }

  await db.$transaction(async (transaction) => {
    const pack = await transaction.curriculumPack.create({
      data: {
        schoolId: actor.schoolId,
        createdByMembershipId: actor.membershipId,
        title: parsed.data.title,
        subject: parsed.data.subject,
        gradeLabel: parsed.data.gradeLabel,
        version: parsed.data.version,
        rightsBasis: parsed.data.rightsBasis as RightsBasis,
        sourceUrl: parsed.data.sourceUrl || null,
        locale: parsed.data.locale === "ml" ? Locale.ml : Locale.en,
        checksum,
        sections: {
          create: sections.map((section) => ({
            referenceId: section.referenceId,
            heading: section.heading,
            content: section.content,
            position: section.position,
            checksum: section.checksum,
          })),
        },
      },
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "curriculum.pack_created",
        entityType: "curriculum_pack",
        entityId: pack.id,
        metadata: {
          version: parsed.data.version,
          sectionCount: sections.length,
          rightsBasis: parsed.data.rightsBasis,
        },
      },
    });
  });

  revalidatePath("/portal/admin");
  revalidatePath("/portal/teacher");
  return {
    status: "success",
    message: `${parsed.data.title} ${parsed.data.version} is active in the school library.`,
  };
}

const curriculumStatusInputSchema = z
  .object({
    packId: z.string().trim().min(8).max(40),
    nextStatus: z.enum(["active", "archived"]),
  })
  .strict();

export async function setCurriculumPackStatusAction(formData: FormData): Promise<void> {
  const actor = await requireActor(SchoolRole.school_admin);
  const parsed = curriculumStatusInputSchema.safeParse({
    packId: formData.get("packId"),
    nextStatus: formData.get("nextStatus"),
  });
  if (!parsed.success) return;

  const updated = await db.curriculumPack.updateMany({
    where: { id: parsed.data.packId, schoolId: actor.schoolId },
    data: {
      status:
        parsed.data.nextStatus === "active"
          ? CurriculumStatus.active
          : CurriculumStatus.archived,
    },
  });
  if (updated.count !== 1) return;
  await db.auditEvent.create({
    data: {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      action: "curriculum.pack_status_changed",
      entityType: "curriculum_pack",
      entityId: parsed.data.packId,
      metadata: { status: parsed.data.nextStatus },
    },
  });
  revalidatePath("/portal/admin");
  revalidatePath("/portal/teacher");
}
