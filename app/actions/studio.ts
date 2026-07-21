"use server";

import { createHash } from "node:crypto";
import {
  AiRunStatus,
  AiStatus,
  ContentOrigin,
  CurriculumStatus,
  FamilyResponse,
  Locale,
  Prisma,
  RightsBasis,
  ScaffoldLevel,
  SchoolRole,
  StudioStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  generateGroundedStudentHelp,
  generateGroundedTeacherPlan,
  getStudentStudioAiCapability,
} from "@/lib/ai/studio-ai";
import {
  normalizeCurriculumText,
  sourceNeedsLinkOnlyTreatment,
  splitCurriculumIntoSections,
} from "@/lib/curriculum/rag";
import { requireActor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  containsDiagnosticObservation,
  inspectTextFields,
  inspectUserText,
} from "@/lib/safety/input-guard";
import {
  CreateStudioInputSchema,
  FamilyResponseInputSchema,
  LearnerSubmissionSchema,
  StudentHelpRequestSchema,
  type StudentThinkingCoach,
  TeacherPlanSchema,
  TeacherReviewInputSchema,
  type TeacherPlan,
} from "@/lib/studio/contracts";
import {
  teacherPlanCitationsAreValid,
  teacherPlanIsSafeForReview,
  teacherPlanTextValues,
} from "@/lib/studio/grounding";
import { createTeacherStarterPlan } from "@/lib/studio/plan";

export type StudioFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export type StudentHelpActionState = {
  status: "success" | "error" | "unavailable" | "safety";
  message: string;
  help?: StudentThinkingCoach;
};

const studioReferenceSchema = z.object({
  studioId: z.string().trim().min(8).max(40),
});

function teacherRoute(studioId?: string, notice?: string): never {
  const query = new URLSearchParams();
  if (studioId) query.set("studio", studioId);
  if (notice) query.set("notice", notice);
  redirect(`/portal/teacher${query.size ? `?${query.toString()}` : ""}`);
}

function studentRoute(notice?: string): never {
  redirect(`/portal/student${notice ? `?notice=${notice}` : ""}`);
}

function parentRoute(notice?: string): never {
  redirect(`/portal/parent${notice ? `?notice=${notice}` : ""}`);
}

function prismaPlan(plan: TeacherPlan): Prisma.InputJsonValue {
  return plan as Prisma.InputJsonValue;
}

function prismaStudentHelp(help: StudentThinkingCoach): Prisma.InputJsonValue {
  return help as Prisma.InputJsonValue;
}

class WorkflowConflictError extends Error {
  constructor() {
    super("workflow-conflict");
    this.name = "WorkflowConflictError";
  }
}

export async function createLearningStudioAction(
  _previousState: StudioFormState,
  formData: FormData,
): Promise<StudioFormState> {
  const actor = await requireActor(SchoolRole.teacher);
  const parsed = CreateStudioInputSchema.safeParse({
    studentMembershipId: formData.get("studentMembershipId"),
    title: formData.get("title"),
    subject: formData.get("subject"),
    gradeLabel: formData.get("gradeLabel"),
    goal: formData.get("goal"),
    drivingQuestion: formData.get("drivingQuestion"),
    familyLocale: formData.get("familyLocale"),
    sourceMode: formData.get("sourceMode") ?? "teacher_source",
    curriculumPackId: formData.get("curriculumPackId") ?? "",
    packTitle: formData.get("packTitle") ?? "",
    packVersion: formData.get("packVersion") ?? "",
    rightsBasis: formData.get("rightsBasis") ?? "",
    sourceUrl: formData.get("sourceUrl") ?? "",
    sourceText: formData.get("sourceText") ?? "",
    rightsConfirmed: formData.get("rightsConfirmed") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Complete the goal and curriculum source before creating the studio.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (
    parsed.data.sourceMode === "teacher_source" &&
    sourceNeedsLinkOnlyTreatment(parsed.data.sourceUrl || null)
  ) {
    return {
      status: "error",
      message: "SCERT-hosted material can be linked, but it cannot be copied into Kanni. Use original or permission-safe lesson notes.",
      fieldErrors: { sourceUrl: ["This source must remain link-only."] },
    };
  }
  const guarded = inspectTextFields([
    parsed.data.title,
    parsed.data.subject,
    parsed.data.goal,
    parsed.data.drivingQuestion,
    ...(parsed.data.sourceMode === "teacher_source"
      ? [parsed.data.packTitle, parsed.data.sourceText]
      : []),
  ]);
  if (guarded.status !== "clear") {
    return {
      status: "error",
      message:
        guarded.status === "personal_data"
          ? "Remove contact details and web addresses from the curriculum text. Add the source link in its own field."
          : "The curriculum text contains an unsafe instruction or high-risk phrase that cannot be sent for planning.",
    };
  }

  const assignment = await db.teacherStudent.findUnique({
    where: {
      teacherMembershipId_studentMembershipId: {
        teacherMembershipId: actor.membershipId,
        studentMembershipId: parsed.data.studentMembershipId,
      },
    },
    select: {
      teacherMembership: { select: { schoolId: true, isActive: true } },
      studentMembership: {
        select: {
          schoolId: true,
          isActive: true,
          studentGuardians: {
            where: { guardianMembership: { isActive: true } },
            select: { guardianMembershipId: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });
  if (
    !assignment ||
    assignment.teacherMembership.schoolId !== actor.schoolId ||
    assignment.studentMembership.schoolId !== actor.schoolId ||
    !assignment.teacherMembership.isActive ||
    !assignment.studentMembership.isActive
  ) {
    return { status: "error", message: "This learner is not assigned to your workspace." };
  }
  const guardianMembershipId =
    assignment.studentMembership.studentGuardians[0]?.guardianMembershipId ?? null;
  if (!guardianMembershipId) {
    return {
      status: "error",
      message: "Ask the school administrator to connect a parent before starting this learning studio.",
    };
  }

  const libraryPack =
    parsed.data.sourceMode === "school_library"
      ? await db.curriculumPack.findFirst({
          where: {
            id: parsed.data.curriculumPackId,
            schoolId: actor.schoolId,
            status: CurriculumStatus.active,
          },
          include: { sections: { orderBy: { position: "asc" } } },
        })
      : null;
  if (parsed.data.sourceMode === "school_library" && !libraryPack) {
    return { status: "error", message: "That school curriculum pack is no longer active." };
  }
  if (
    libraryPack &&
    (libraryPack.subject !== parsed.data.subject ||
      libraryPack.gradeLabel !== parsed.data.gradeLabel)
  ) {
    return {
      status: "error",
      message: `Choose ${libraryPack.subject} and ${libraryPack.gradeLabel} for this curriculum pack.`,
    };
  }

  const normalizedSource =
    parsed.data.sourceMode === "teacher_source"
      ? normalizeCurriculumText(parsed.data.sourceText)
      : "";
  const sections = libraryPack?.sections ?? splitCurriculumIntoSections(normalizedSource);
  if (sections.length === 0) {
    return { status: "error", message: "The curriculum source could not be divided into usable sections." };
  }
  const starterPlan = createTeacherStarterPlan({
    goal: parsed.data.goal,
    drivingQuestion: parsed.data.drivingQuestion,
    familyLocale: parsed.data.familyLocale,
    sections,
  });
  const previousReview = await db.teacherReview.findFirst({
    where: {
      studio: {
        schoolId: actor.schoolId,
        teacherMembershipId: actor.membershipId,
        studentMembershipId: parsed.data.studentMembershipId,
      },
    },
    select: { nextScaffoldLevel: true },
    orderBy: { createdAt: "desc" },
  });

  const studio = await db.$transaction(async (transaction) => {
    const curriculumPackId = libraryPack
      ? libraryPack.id
      : (
          await transaction.curriculumPack.create({
            data: {
              schoolId: actor.schoolId,
              createdByMembershipId: actor.membershipId,
              title: parsed.data.packTitle,
              subject: parsed.data.subject,
              gradeLabel: parsed.data.gradeLabel,
              version: parsed.data.packVersion,
              rightsBasis: parsed.data.rightsBasis as RightsBasis,
              sourceUrl: parsed.data.sourceUrl || null,
              locale: parsed.data.familyLocale === "ml" ? Locale.ml : Locale.en,
              checksum: createHash("sha256").update(normalizedSource).digest("hex"),
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
          })
        ).id;
    const created = await transaction.learningStudio.create({
      data: {
        schoolId: actor.schoolId,
        teacherMembershipId: actor.membershipId,
        studentMembershipId: parsed.data.studentMembershipId,
        guardianMembershipId,
        curriculumPackId,
        title: parsed.data.title,
        subject: parsed.data.subject,
        gradeLabel: parsed.data.gradeLabel,
        goal: parsed.data.goal,
        drivingQuestion: parsed.data.drivingQuestion,
        familyLocale: parsed.data.familyLocale === "ml" ? Locale.ml : Locale.en,
        plan: prismaPlan(starterPlan),
        scaffoldLevel: previousReview?.nextScaffoldLevel ?? ScaffoldLevel.guided,
      },
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "studio.created",
        entityType: "learning_studio",
        entityId: created.id,
        metadata: {
          studentMembershipId: parsed.data.studentMembershipId,
          curriculumPackId,
          sectionCount: sections.length,
          sourceMode: parsed.data.sourceMode,
          rightsBasis: libraryPack?.rightsBasis ?? parsed.data.rightsBasis,
        },
      },
    });
    return created;
  });

  revalidatePath("/portal/teacher");
  teacherRoute(studio.id, "studio-created");
}

export async function generateTeacherPlanAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.teacher);
  const reference = studioReferenceSchema.safeParse({ studioId: formData.get("studioId") });
  if (!reference.success) teacherRoute(undefined, "studio-missing");

  const studio = await db.learningStudio.findFirst({
    where: {
      id: reference.data.studioId,
      schoolId: actor.schoolId,
      teacherMembershipId: actor.membershipId,
      status: StudioStatus.planning,
      aiStatus: AiStatus.not_requested,
    },
    include: { curriculumPack: { include: { sections: { orderBy: { position: "asc" } } } } },
  });
  if (!studio) teacherRoute(reference.data.studioId, "ai-already-used");

  const outboundGuard = inspectTextFields(
    [
      studio.title,
      studio.subject,
      studio.goal,
      studio.drivingQuestion,
      studio.curriculumPack.title,
      ...studio.curriculumPack.sections.flatMap((section) => [
        section.heading,
        section.content,
      ]),
    ],
    { aiBound: true },
  );
  if (outboundGuard.status !== "clear") {
    const rejected = await db.$transaction(async (transaction) => {
      const updated = await transaction.learningStudio.updateMany({
        where: {
          id: studio.id,
          teacherMembershipId: actor.membershipId,
          status: StudioStatus.planning,
          aiStatus: AiStatus.not_requested,
          version: studio.version,
        },
        data: { aiStatus: AiStatus.rejected, version: { increment: 1 } },
      });
      if (updated.count !== 1) return false;
      await transaction.auditEvent.create({
        data: {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "studio.ai_input_rejected",
          entityType: "learning_studio",
          entityId: studio.id,
          metadata: { reason: outboundGuard.status },
        },
      });
      return true;
    });
    if (!rejected) teacherRoute(studio.id, "ai-already-used");
    revalidatePath("/portal/teacher");
    teacherRoute(studio.id, "ai-plan-unavailable");
  }

  const claimed = await db.learningStudio.updateMany({
    where: {
      id: studio.id,
      teacherMembershipId: actor.membershipId,
      status: StudioStatus.planning,
      aiStatus: AiStatus.not_requested,
      version: studio.version,
    },
    data: { aiStatus: AiStatus.unavailable, version: { increment: 1 } },
  });
  if (claimed.count !== 1) teacherRoute(studio.id, "ai-already-used");

  const result = await generateGroundedTeacherPlan({
    title: studio.title,
    subject: studio.subject,
    gradeLabel: studio.gradeLabel,
    goal: studio.goal,
    drivingQuestion: studio.drivingQuestion,
    familyLocale: studio.familyLocale,
    sections: studio.curriculumPack.sections,
  });
  const nextAiStatus =
    result.status === "succeeded"
      ? AiStatus.ready
      : result.status === "rejected"
        ? AiStatus.rejected
        : AiStatus.unavailable;

  const resultStored = await db.$transaction(async (transaction) => {
    const updated = await transaction.learningStudio.updateMany({
      where: {
        id: studio.id,
        teacherMembershipId: actor.membershipId,
        status: StudioStatus.planning,
        aiStatus: AiStatus.unavailable,
        version: studio.version + 1,
      },
      data: {
        aiStatus: nextAiStatus,
        ...(result.plan
          ? {
              plan: prismaPlan(result.plan),
              planOrigin: ContentOrigin.gpt_5_6,
              planPromptVersion: result.promptVersion,
              aiModel: result.model,
            }
          : {}),
        version: { increment: 1 },
      },
    });
    const stored = updated.count === 1;
    if (result.status !== "unavailable") {
      await transaction.aiRun.create({
        data: {
          schoolId: actor.schoolId,
          studioId: studio.id,
          actorMembershipId: actor.membershipId,
          purpose: "teacher_plan",
          provider: "openrouter",
          model: result.model,
          status: !stored
            ? AiRunStatus.rejected
            : result.status === "succeeded"
              ? AiRunStatus.succeeded
              : result.status === "rejected"
                ? AiRunStatus.rejected
                : AiRunStatus.provider_error,
          promptVersion: result.promptVersion,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          costMicros: result.costMicros,
          latencyMs: result.latencyMs,
          errorCode: stored ? result.errorCode : "workflow_conflict",
          citationIds: stored ? result.citationIds : [],
        },
      });
    }
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "studio.ai_plan_finished",
        entityType: "learning_studio",
        entityId: studio.id,
        metadata: {
          status: stored ? result.status : "workflow_conflict",
          promptVersion: result.promptVersion,
        },
      },
    });
    return stored;
  });

  revalidatePath("/portal/teacher");
  teacherRoute(
    studio.id,
    result.status === "succeeded" && resultStored
      ? "ai-plan-ready"
      : "ai-plan-unavailable",
  );
}

export async function requestStudentThinkingHelpAction(
  formData: FormData,
): Promise<StudentHelpActionState> {
  const actor = await requireActor(SchoolRole.student);
  const parsed = StudentHelpRequestSchema.safeParse({
    studioId: formData.get("studioId"),
    firstDraft: formData.get("firstDraft"),
    adultSupervisionConfirmed: formData.get("adultSupervisionConfirmed"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Write a first attempt of at least 60 characters and confirm adult supervision before asking for a next step.",
    };
  }
  const inputGuard = inspectUserText(parsed.data.firstDraft, { aiBound: true });
  if (inputGuard.status === "high_risk") {
    return {
      status: "safety",
      message: "Pause this activity and speak to a trusted adult now. If you may be in immediate danger, call 112. Childline is 1098 and Tele-MANAS is 14416.",
    };
  }
  if (inputGuard.status !== "clear") {
    return {
      status: "error",
      message:
        inputGuard.status === "personal_data"
          ? "Remove phone numbers, email addresses, social handles, and web links before using AI help."
          : "Keep the first attempt about the learning task. Requests to change or reveal Kanni's instructions are not sent.",
    };
  }
  const capability = getStudentStudioAiCapability();
  if (!capability.available) {
    return {
      status: "unavailable",
      message: "AI help is off right now. The teacher-reviewed thinking prompts remain available.",
    };
  }

  const studio = await db.learningStudio.findFirst({
    where: {
      id: parsed.data.studioId,
      schoolId: actor.schoolId,
      studentMembershipId: actor.membershipId,
      status: StudioStatus.ready_for_student,
      studentHelpStatus: AiStatus.not_requested,
      submission: null,
    },
    include: {
      curriculumPack: { include: { sections: { orderBy: { position: "asc" } } } },
    },
  });
  if (!studio) {
    return {
      status: "unavailable",
      message: "This studio has already used its thinking-coach request or moved to review.",
    };
  }
  const outboundGuard = inspectTextFields(
    [
      studio.subject,
      studio.gradeLabel,
      studio.goal,
      studio.drivingQuestion,
      ...studio.curriculumPack.sections.flatMap((section) => [
        section.heading,
        section.content,
      ]),
    ],
    { aiBound: true },
  );
  if (outboundGuard.status !== "clear") {
    return {
      status: "unavailable",
      message: "The lesson context did not pass Kanni's AI boundary. Use the teacher-reviewed prompts instead.",
    };
  }

  const claimed = await db.learningStudio.updateMany({
    where: {
      id: studio.id,
      studentMembershipId: actor.membershipId,
      status: StudioStatus.ready_for_student,
      studentHelpStatus: AiStatus.not_requested,
      version: studio.version,
      submission: null,
    },
    data: { studentHelpStatus: AiStatus.unavailable, version: { increment: 1 } },
  });
  if (claimed.count !== 1) {
    return {
      status: "unavailable",
      message: "Another request already claimed this studio. Refresh to see its result.",
    };
  }

  const result = await generateGroundedStudentHelp({
    subject: studio.subject,
    gradeLabel: studio.gradeLabel,
    goal: studio.goal,
    drivingQuestion: studio.drivingQuestion,
    firstDraft: parsed.data.firstDraft,
    sections: studio.curriculumPack.sections,
  });
  const nextStatus =
    result.status === "succeeded"
      ? AiStatus.ready
      : result.status === "rejected"
        ? AiStatus.rejected
        : AiStatus.unavailable;

  const stored = await db.$transaction(async (transaction) => {
    const updated = await transaction.learningStudio.updateMany({
      where: {
        id: studio.id,
        studentMembershipId: actor.membershipId,
        status: StudioStatus.ready_for_student,
        studentHelpStatus: AiStatus.unavailable,
        version: studio.version + 1,
        submission: null,
      },
      data: { studentHelpStatus: nextStatus, version: { increment: 1 } },
    });
    if (updated.count !== 1) return false;
    if (result.help) {
      await transaction.studentHelp.create({
        data: {
          studioId: studio.id,
          studentMembershipId: actor.membershipId,
          response: prismaStudentHelp(result.help),
          sourceSectionIds: result.citationIds,
          model: result.model,
          promptVersion: result.promptVersion,
        },
      });
    }
    if (result.status !== "unavailable") {
      await transaction.aiRun.create({
        data: {
          schoolId: actor.schoolId,
          studioId: studio.id,
          actorMembershipId: actor.membershipId,
          purpose: "student_thinking_help",
          provider: "openrouter",
          model: result.model,
          status:
            result.status === "succeeded"
              ? AiRunStatus.succeeded
              : result.status === "rejected"
                ? AiRunStatus.rejected
                : AiRunStatus.provider_error,
          promptVersion: result.promptVersion,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          costMicros: result.costMicros,
          latencyMs: result.latencyMs,
          errorCode: result.errorCode,
          citationIds: result.citationIds,
        },
      });
    }
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "studio.student_help_finished",
        entityType: "learning_studio",
        entityId: studio.id,
        metadata: { status: result.status, promptVersion: result.promptVersion },
      },
    });
    return true;
  });

  revalidatePath("/portal/teacher");
  revalidatePath("/portal/admin");
  if (result.status === "succeeded" && result.help && stored) {
    return {
      status: "success",
      message: "Your creative next steps are ready. You still decide what to make and revise.",
      help: result.help,
    };
  }
  return {
    status: "unavailable",
    message: "Kanni did not show that AI response. Use the teacher-reviewed thinking prompts instead.",
  };
}

function parsePlanJson(value: FormDataEntryValue | null): TeacherPlan | null {
  if (typeof value !== "string" || value.length > 60_000) return null;
  try {
    const parsed = TeacherPlanSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveTeacherPlanAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.teacher);
  const reference = studioReferenceSchema.safeParse({ studioId: formData.get("studioId") });
  const plan = parsePlanJson(formData.get("planJson"));
  if (!reference.success || !plan) teacherRoute(undefined, "invalid-plan");

  const studio = await db.learningStudio.findFirst({
    where: {
      id: reference.data.studioId,
      schoolId: actor.schoolId,
      teacherMembershipId: actor.membershipId,
      status: StudioStatus.planning,
    },
    select: {
      id: true,
      version: true,
      curriculumPack: {
        select: { sections: { select: { referenceId: true } } },
      },
    },
  });
  if (!studio) teacherRoute(reference.data.studioId, "plan-locked");
  if (!teacherPlanCitationsAreValid(plan, studio.curriculumPack.sections)) {
    teacherRoute(studio.id, "invalid-citations");
  }
  if (inspectTextFields(teacherPlanTextValues(plan)).status !== "clear") {
    teacherRoute(studio.id, "remove-personal-data");
  }
  if (!teacherPlanIsSafeForReview(plan)) {
    teacherRoute(studio.id, "use-observation-language");
  }

  const updated = await db.learningStudio.updateMany({
    where: {
      id: studio.id,
      teacherMembershipId: actor.membershipId,
      status: StudioStatus.planning,
      version: studio.version,
    },
    data: { plan: prismaPlan(plan), version: { increment: 1 } },
  });
  if (updated.count !== 1) teacherRoute(studio.id, "plan-locked");
  await db.auditEvent.create({
    data: {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      action: "studio.plan_edited",
      entityType: "learning_studio",
      entityId: studio.id,
    },
  });
  revalidatePath("/portal/teacher");
  teacherRoute(studio.id, "plan-saved");
}

export async function publishLearningStudioAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.teacher);
  const submittedPlanEntry = formData.get("planJson");
  const submittedPlan =
    submittedPlanEntry === null ? null : parsePlanJson(submittedPlanEntry);
  if (submittedPlanEntry !== null && !submittedPlan) {
    teacherRoute(undefined, "invalid-plan");
  }
  const parsed = z
    .object({
      studioId: z.string().trim().min(8).max(40),
      reviewed: z.literal("yes"),
    })
    .safeParse({
      studioId: formData.get("studioId"),
      reviewed: formData.get("reviewed"),
    });
  if (!parsed.success) teacherRoute(undefined, "review-plan-first");

  const studio = await db.learningStudio.findFirst({
    where: {
      id: parsed.data.studioId,
      schoolId: actor.schoolId,
      teacherMembershipId: actor.membershipId,
      status: StudioStatus.planning,
    },
    include: { curriculumPack: { select: { sections: { select: { referenceId: true } } } } },
  });
  if (!studio) teacherRoute(parsed.data.studioId, "plan-locked");
  const plan = submittedPlan
    ? { success: true as const, data: submittedPlan }
    : TeacherPlanSchema.safeParse(studio.plan);
  if (
    !plan.success ||
    !teacherPlanCitationsAreValid(plan.data, studio.curriculumPack.sections) ||
    !teacherPlanIsSafeForReview(plan.data)
  ) {
    teacherRoute(studio.id, "invalid-plan");
  }

  const [teacherLink, guardianLink] = await Promise.all([
    db.teacherStudent.count({
      where: {
        teacherMembershipId: actor.membershipId,
        studentMembershipId: studio.studentMembershipId,
      },
    }),
    studio.guardianMembershipId
      ? db.guardianStudent.count({
          where: {
            guardianMembershipId: studio.guardianMembershipId,
            studentMembershipId: studio.studentMembershipId,
          },
        })
      : Promise.resolve(0),
  ]);
  if (teacherLink !== 1 || guardianLink !== 1) teacherRoute(studio.id, "support-circle-incomplete");

  const updated = await db.learningStudio.updateMany({
    where: {
      id: studio.id,
      teacherMembershipId: actor.membershipId,
      status: StudioStatus.planning,
      version: studio.version,
    },
    data: {
      ...(submittedPlan ? { plan: prismaPlan(submittedPlan) } : {}),
      status: StudioStatus.ready_for_student,
      planReviewedAt: new Date(),
      publishedAt: new Date(),
      version: { increment: 1 },
    },
  });
  if (updated.count !== 1) teacherRoute(studio.id, "plan-locked");
  await db.auditEvent.create({
    data: {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      action: "studio.published",
      entityType: "learning_studio",
      entityId: studio.id,
      metadata: { scaffoldLevel: studio.scaffoldLevel },
    },
  });
  revalidatePath("/portal/student");
  teacherRoute(studio.id, "studio-published");
}

export async function submitLearnerWorkAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.student);
  const reference = studioReferenceSchema.safeParse({ studioId: formData.get("studioId") });
  const submission = LearnerSubmissionSchema.safeParse({
    interestHookIndex: formData.get("interestHookIndex"),
    makerChoiceId: formData.get("makerChoiceId"),
    prediction: formData.get("prediction"),
    firstDraft: formData.get("firstDraft"),
    selfCritique: formData.get("selfCritique"),
    revision: formData.get("revision"),
    explanation: formData.get("explanation"),
    reflection: formData.get("reflection"),
    supportOpened: formData.get("supportOpened") === "true",
  });
  if (!reference.success || !submission.success) studentRoute("complete-all-steps");
  const guarded = inspectTextFields([
    submission.data.prediction,
    submission.data.firstDraft,
    submission.data.selfCritique,
    submission.data.revision,
    submission.data.explanation,
    submission.data.reflection,
  ]);
  if (guarded.status === "high_risk") studentRoute("safety-support");
  if (guarded.status !== "clear") studentRoute("remove-personal-data");

  const studio = await db.learningStudio.findFirst({
    where: {
      id: reference.data.studioId,
      schoolId: actor.schoolId,
      studentMembershipId: actor.membershipId,
      status: StudioStatus.ready_for_student,
      submission: null,
    },
    select: { id: true, plan: true, version: true },
  });
  if (!studio) studentRoute("activity-closed");
  const plan = TeacherPlanSchema.safeParse(studio.plan);
  if (
    !plan.success ||
    !plan.data.interestHooks[submission.data.interestHookIndex] ||
    !plan.data.makerChoices.some((choice) => choice.id === submission.data.makerChoiceId)
  ) {
    studentRoute("activity-changed");
  }

  const submitted = await db.$transaction(async (transaction) => {
    const updated = await transaction.learningStudio.updateMany({
      where: {
        id: studio.id,
        studentMembershipId: actor.membershipId,
        status: StudioStatus.ready_for_student,
        version: studio.version,
        submission: null,
      },
      data: {
        status: StudioStatus.awaiting_teacher_review,
        evidenceSubmittedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) return false;
    await transaction.learnerSubmission.create({
      data: { studioId: studio.id, ...submission.data },
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "studio.learner_work_submitted",
        entityType: "learning_studio",
        entityId: studio.id,
        metadata: {
          makerChoiceId: submission.data.makerChoiceId,
          supportOpened: submission.data.supportOpened,
        },
      },
    });
    return true;
  });
  if (!submitted) studentRoute("activity-closed");
  revalidatePath("/portal/teacher");
  studentRoute("work-submitted");
}

export async function reviewLearnerWorkAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.teacher);
  const reference = studioReferenceSchema.safeParse({ studioId: formData.get("studioId") });
  const review = TeacherReviewInputSchema.safeParse({
    noticedStrength: formData.get("noticedStrength"),
    studentFeedback: formData.get("studentFeedback"),
    nextQuestion: formData.get("nextQuestion"),
    nextScaffoldLevel: formData.get("nextScaffoldLevel"),
    familyActivity: formData.get("familyActivity"),
    reviewedEvidence: formData.get("reviewedEvidence"),
  });
  if (!reference.success || !review.success) teacherRoute(undefined, "complete-review");
  const reviewText = [
    review.data.noticedStrength,
    review.data.studentFeedback,
    review.data.nextQuestion,
    review.data.familyActivity,
  ];
  if (inspectTextFields(reviewText).status !== "clear") {
    teacherRoute(reference.data.studioId, "remove-personal-data");
  }
  if (reviewText.some(containsDiagnosticObservation)) {
    teacherRoute(reference.data.studioId, "use-observation-language");
  }

  const studio = await db.learningStudio.findFirst({
    where: {
      id: reference.data.studioId,
      schoolId: actor.schoolId,
      teacherMembershipId: actor.membershipId,
      status: StudioStatus.awaiting_teacher_review,
      submission: { isNot: null },
      teacherReview: null,
    },
    select: { id: true, version: true },
  });
  if (!studio) teacherRoute(reference.data.studioId, "review-closed");

  const recorded = await db.$transaction(async (transaction) => {
    const updated = await transaction.learningStudio.updateMany({
      where: {
        id: studio.id,
        teacherMembershipId: actor.membershipId,
        status: StudioStatus.awaiting_teacher_review,
        version: studio.version,
        teacherReview: null,
      },
      data: {
        status: StudioStatus.ready_for_family,
        reviewedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) return false;
    await transaction.teacherReview.create({
      data: {
        studioId: studio.id,
        teacherMembershipId: actor.membershipId,
        noticedStrength: review.data.noticedStrength,
        studentFeedback: review.data.studentFeedback,
        nextQuestion: review.data.nextQuestion,
        nextScaffoldLevel: review.data.nextScaffoldLevel as ScaffoldLevel,
        familyActivity: review.data.familyActivity,
      },
    });
    await transaction.familyHandoff.create({
      data: { studioId: studio.id, activity: review.data.familyActivity },
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "studio.teacher_review_completed",
        entityType: "learning_studio",
        entityId: studio.id,
        metadata: { nextScaffoldLevel: review.data.nextScaffoldLevel },
      },
    });
    return true;
  });
  if (!recorded) teacherRoute(studio.id, "review-closed");
  revalidatePath("/portal/parent");
  teacherRoute(studio.id, "review-complete");
}

export async function recordFamilyResponseAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.parent);
  const reference = studioReferenceSchema.safeParse({ studioId: formData.get("studioId") });
  const response = FamilyResponseInputSchema.safeParse({
    response: formData.get("response"),
    note: formData.get("note") ?? "",
  });
  if (!reference.success || !response.success) parentRoute("choose-response");
  if (response.data.note) {
    const guarded = inspectUserText(response.data.note);
    if (guarded.status === "high_risk") parentRoute("safety-support");
    if (guarded.status !== "clear") parentRoute("remove-personal-data");
  }

  const studio = await db.learningStudio.findFirst({
    where: {
      id: reference.data.studioId,
      schoolId: actor.schoolId,
      guardianMembershipId: actor.membershipId,
      status: StudioStatus.ready_for_family,
      familyHandoff: { is: { response: FamilyResponse.not_sent } },
    },
    select: { id: true, version: true },
  });
  if (!studio) parentRoute("activity-closed");

  let recorded = false;
  try {
    recorded = await db.$transaction(async (transaction) => {
      const handoff = await transaction.familyHandoff.updateMany({
        where: { studioId: studio.id, response: FamilyResponse.not_sent },
        data: {
          response: response.data.response as FamilyResponse,
          parentNote: response.data.note || null,
          respondedAt: new Date(),
        },
      });
      if (handoff.count !== 1) throw new WorkflowConflictError();
      const updated = await transaction.learningStudio.updateMany({
        where: {
          id: studio.id,
          guardianMembershipId: actor.membershipId,
          status: StudioStatus.ready_for_family,
          version: studio.version,
        },
        data: {
          status: StudioStatus.complete,
          familyRespondedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) throw new WorkflowConflictError();
      await transaction.auditEvent.create({
        data: {
          schoolId: actor.schoolId,
          actorUserId: actor.userId,
          action: "studio.family_response_recorded",
          entityType: "learning_studio",
          entityId: studio.id,
          metadata: { response: response.data.response },
        },
      });
      return true;
    });
  } catch (error: unknown) {
    if (!(error instanceof WorkflowConflictError)) throw error;
  }
  if (!recorded) parentRoute("activity-closed");
  revalidatePath("/portal/teacher");
  parentRoute("response-sent");
}
