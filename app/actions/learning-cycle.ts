"use server";

import {
  AiStatus,
  ContentOrigin,
  CycleStatus,
  FamilyResponse,
  ReviewStatus,
  ScaffoldLevel,
  SchoolRole,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  generateStudentSupportDraft,
  generateTeacherPlanDraft,
} from "@/lib/ai/growth-ai";
import { requireActor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ExplanationChoiceSchema,
  FamilyResponseSchema,
  FractionAnswerSchema,
  PROJECT_AUTHORED_PLAN,
  PROJECT_AUTHORED_SUPPORTS,
  ScaffoldLevelSchema,
  StudentArtifactSubmissionSchema,
  SupportStrategySchema,
  getProjectAuthoredSupport,
} from "@/lib/growth-cycle";

function portal(role: SchoolRole, notice?: string): never {
  const route = role === SchoolRole.school_admin ? "admin" : role;
  redirect(`/portal/${route}${notice ? `?notice=${notice}` : ""}`);
}

function promptsForScaffold(
  prompts: readonly string[],
  level: ScaffoldLevel,
): string[] {
  if (level === ScaffoldLevel.independent) return [];
  if (level === ScaffoldLevel.light) return prompts.slice(-1);
  return [...prompts];
}

async function cycleForMembership(
  schoolId: string,
  membershipField:
    | "teacherMembershipId"
    | "studentMembershipId"
    | "guardianMembershipId",
  membershipId: string,
) {
  return db.learningCycle.findFirst({
    where: {
      schoolId,
      [membershipField]: membershipId,
      status: { not: CycleStatus.archived },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function publishTeacherPlanAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.teacher);
  const strategy = SupportStrategySchema.safeParse(formData.get("strategy"));
  if (!strategy.success) portal(actor.role, "invalid-strategy");
  const cycle = await cycleForMembership(
    actor.schoolId,
    "teacherMembershipId",
    actor.membershipId,
  );
  if (!cycle) portal(actor.role, "cycle-missing");

  await db.$transaction(async (transaction) => {
    const relationshipCount = await transaction.teacherStudent.count({
      where: {
        teacherMembershipId: actor.membershipId,
        studentMembershipId: cycle.studentMembershipId,
        teacherMembership: {
          schoolId: actor.schoolId,
          role: SchoolRole.teacher,
          isActive: true,
        },
        studentMembership: {
          schoolId: actor.schoolId,
          role: SchoolRole.student,
          isActive: true,
        },
      },
    });
    const guardianRelationshipCount = cycle.guardianMembershipId
      ? await transaction.guardianStudent.count({
          where: {
            guardianMembershipId: cycle.guardianMembershipId,
            studentMembershipId: cycle.studentMembershipId,
            guardianMembership: {
              schoolId: actor.schoolId,
              role: SchoolRole.parent,
              isActive: true,
            },
            studentMembership: {
              schoolId: actor.schoolId,
              role: SchoolRole.student,
              isActive: true,
            },
          },
        })
      : 0;
    if (relationshipCount !== 1 || guardianRelationshipCount !== 1) {
      throw new Error("support-circle-incomplete");
    }
    const updated = await transaction.learningCycle.updateMany({
      where: {
        id: cycle.id,
        teacherMembershipId: actor.membershipId,
        status: CycleStatus.draft,
      },
      data: {
        status: CycleStatus.active,
        selectedSupport: strategy.data,
        publishedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new Error("cycle-state-changed");
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "cycle.plan_published",
        entityType: "learning_cycle",
        entityId: cycle.id,
        metadata: { selectedSupport: strategy.data },
      },
    });
  });
  portal(actor.role, "plan-published");
}

export async function draftTeacherPlanWithAiAction(): Promise<never> {
  const actor = await requireActor(SchoolRole.teacher);
  const cycle = await cycleForMembership(
    actor.schoolId,
    "teacherMembershipId",
    actor.membershipId,
  );
  if (
    !cycle ||
    cycle.status !== CycleStatus.draft ||
    cycle.aiStatus !== AiStatus.not_requested
  ) {
    portal(actor.role, "plan-locked");
  }
  const claimed = await db.learningCycle.updateMany({
    where: {
      id: cycle.id,
      teacherMembershipId: actor.membershipId,
      status: CycleStatus.draft,
      aiStatus: AiStatus.not_requested,
    },
    data: {
      aiStatus: AiStatus.unavailable,
      version: { increment: 1 },
    },
  });
  if (claimed.count !== 1) portal(actor.role, "plan-locked");

  const result = await generateTeacherPlanDraft(cycle.familyLocale);
  const updated = await db.learningCycle.updateMany({
    where: {
      id: cycle.id,
      teacherMembershipId: actor.membershipId,
      status: CycleStatus.draft,
      aiStatus: AiStatus.unavailable,
    },
    data: {
      planOrigin:
        result.origin === "gpt_5_6"
          ? ContentOrigin.gpt_5_6
          : ContentOrigin.project_authored,
      aiStatus:
        result.origin === "gpt_5_6" ? AiStatus.ready : AiStatus.unavailable,
      planSuccessCriteria: result.draft.successCriteria,
      planLearningSequence: result.draft.learningSequence,
      misconceptionIds: result.draft.misconceptionIds,
      quickCheck: result.draft.quickCheck,
      familyDraft: result.draft.familyDraft,
      planAgencyMove: result.draft.agencyMove,
      sourceSectionIds: result.draft.sourceSectionIds,
      version: { increment: 1 },
    },
  });
  if (updated.count !== 1) portal(actor.role, "plan-locked");
  portal(actor.role, result.origin === "gpt_5_6" ? "ai-draft-ready" : "authored-plan-ready");
}

export async function restoreProjectAuthoredPlanAction(): Promise<never> {
  const actor = await requireActor(SchoolRole.teacher);
  const cycle = await cycleForMembership(
    actor.schoolId,
    "teacherMembershipId",
    actor.membershipId,
  );
  if (!cycle || cycle.status !== CycleStatus.draft) portal(actor.role, "plan-locked");
  const updated = await db.learningCycle.updateMany({
    where: {
      id: cycle.id,
      teacherMembershipId: actor.membershipId,
      status: CycleStatus.draft,
    },
    data: {
      planOrigin: ContentOrigin.project_authored,
      aiStatus: AiStatus.ready,
      planSuccessCriteria: PROJECT_AUTHORED_PLAN.successCriteria,
      planLearningSequence: PROJECT_AUTHORED_PLAN.learningSequence,
      misconceptionIds: PROJECT_AUTHORED_PLAN.misconceptionIds,
      quickCheck: PROJECT_AUTHORED_PLAN.quickCheck,
      familyDraft: PROJECT_AUTHORED_PLAN.familyDraft,
      planAgencyMove: PROJECT_AUTHORED_PLAN.agencyMove,
      sourceSectionIds: PROJECT_AUTHORED_PLAN.sourceSectionIds,
      version: { increment: 1 },
    },
  });
  if (updated.count !== 1) portal(actor.role, "plan-locked");
  portal(actor.role, "authored-plan-ready");
}

export async function recordFirstAnswerAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.student);
  const answer = FractionAnswerSchema.safeParse(formData.get("answer"));
  if (!answer.success) portal(actor.role, "choose-answer");
  const cycle = await cycleForMembership(
    actor.schoolId,
    "studentMembershipId",
    actor.membershipId,
  );
  if (!cycle) portal(actor.role, "cycle-missing");
  const updated = await db.learningCycle.updateMany({
    where: {
      id: cycle.id,
      studentMembershipId: actor.membershipId,
      status: CycleStatus.active,
      firstAnswer: null,
    },
    data: { firstAnswer: answer.data, version: { increment: 1 } },
  });
  if (updated.count !== 1) portal(actor.role, "answer-already-recorded");
  portal(actor.role, "answer-recorded");
}

export async function useStudentSupportAction(): Promise<never> {
  const actor = await requireActor(SchoolRole.student);
  const cycle = await cycleForMembership(
    actor.schoolId,
    "studentMembershipId",
    actor.membershipId,
  );
  if (!cycle || cycle.status !== CycleStatus.active || !cycle.firstAnswer) {
    portal(actor.role, "answer-first");
  }
  if (cycle.supportUsed) portal(actor.role, "support-open");
  const reviewedSupport = getProjectAuthoredSupport(
    cycle.selectedSupport,
    actor.locale,
  );
  const claimed = await db.learningCycle.updateMany({
    where: {
      id: cycle.id,
      studentMembershipId: actor.membershipId,
      status: CycleStatus.active,
      supportUsed: false,
      firstAnswer: { not: null },
    },
    data: {
      supportUsed: true,
      supportOrigin: ContentOrigin.project_authored,
      supportExplanation: reviewedSupport.explanation,
      supportThinkingPrompts: promptsForScaffold(
        reviewedSupport.thinkingPrompts,
        cycle.scaffoldLevel,
      ),
      supportHandoffPrompt: reviewedSupport.handoffPrompt,
      supportSourceIds: reviewedSupport.sourceSectionIds,
      version: { increment: 1 },
    },
  });
  if (claimed.count !== 1) portal(actor.role, "support-open");
  if (cycle.scaffoldLevel === ScaffoldLevel.independent) {
    portal(actor.role, "independent-start");
  }

  const result = await generateStudentSupportDraft(
    cycle.selectedSupport,
    actor.locale,
  );
  if (result.origin === "gpt_5_6") {
    await db.learningCycle.updateMany({
      where: {
        id: cycle.id,
        studentMembershipId: actor.membershipId,
        status: CycleStatus.active,
        supportUsed: true,
        revisedAnswer: null,
      },
      data: {
        supportOrigin: ContentOrigin.gpt_5_6,
        supportExplanation: result.support.explanation,
        supportThinkingPrompts: promptsForScaffold(
          result.support.thinkingPrompts,
          cycle.scaffoldLevel,
        ),
        supportHandoffPrompt: result.support.handoffPrompt,
        supportSourceIds: result.support.sourceSectionIds,
        version: { increment: 1 },
      },
    });
  }
  portal(actor.role, "support-open");
}

export async function recordRevisionAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.student);
  const evidence = z
    .object({
      answer: FractionAnswerSchema,
      explanation: ExplanationChoiceSchema,
    })
    .safeParse({
      answer: formData.get("answer"),
      explanation: formData.get("explanation"),
    });
  const artifact = StudentArtifactSubmissionSchema.safeParse({
    makerPath: formData.get("makerPath"),
    artifactDraft: formData.get("artifactDraft"),
    artifactCritique: formData.get("artifactCritique"),
    artifactRevision: formData.get("artifactRevision"),
  });
  if (!evidence.success || !artifact.success) {
    portal(actor.role, "complete-maker-evidence");
  }
  const cycle = await cycleForMembership(
    actor.schoolId,
    "studentMembershipId",
    actor.membershipId,
  );
  if (!cycle) portal(actor.role, "cycle-missing");
  const recorded = await db.$transaction(async (transaction) => {
    const updated = await transaction.learningCycle.updateMany({
      where: {
        id: cycle.id,
        studentMembershipId: actor.membershipId,
        status: CycleStatus.active,
        supportUsed: true,
        revisedAnswer: null,
      },
      data: {
        makerPath: artifact.data.makerPath,
        artifactDraft: artifact.data.artifactDraft,
        artifactCritique: artifact.data.artifactCritique,
        artifactRevision: artifact.data.artifactRevision,
        artifactSubmittedAt: new Date(),
        revisedAnswer: evidence.data.answer,
        explanationChoice: evidence.data.explanation,
        status: CycleStatus.waiting_teacher_review,
        evidenceSubmittedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) return false;
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "cycle.student_evidence_submitted",
        entityType: "learning_cycle",
        entityId: cycle.id,
        metadata: {
          makerPath: artifact.data.makerPath,
          artifactCritique: artifact.data.artifactCritique,
          scaffoldLevel: cycle.scaffoldLevel,
        },
      },
    });
    return true;
  });
  if (!recorded) portal(actor.role, "evidence-already-sent");
  portal(actor.role, "evidence-sent");
}

export async function flagStudentDisagreementAction(): Promise<never> {
  const actor = await requireActor(SchoolRole.student);
  const cycle = await cycleForMembership(
    actor.schoolId,
    "studentMembershipId",
    actor.membershipId,
  );
  if (!cycle) portal(actor.role, "cycle-missing");
  const recorded = await db.$transaction(async (transaction) => {
    const updated = await transaction.learningCycle.updateMany({
      where: {
        id: cycle.id,
        studentMembershipId: actor.membershipId,
        status: CycleStatus.waiting_teacher_review,
        revisedAnswer: { not: null },
        disagreedWithRecord: false,
      },
      data: { disagreedWithRecord: true, version: { increment: 1 } },
    });
    if (updated.count !== 1) return false;
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "cycle.student_record_challenged",
        entityType: "learning_cycle",
        entityId: cycle.id,
      },
    });
    return true;
  });
  if (!recorded) portal(actor.role, "disagreement-already-recorded");
  portal(actor.role, "disagreement-recorded");
}

export async function reviewStudentEvidenceAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.teacher);
  const strategy = SupportStrategySchema.safeParse(formData.get("nextSupport"));
  const scaffold = ScaffoldLevelSchema.safeParse(
    formData.get("nextScaffoldLevel"),
  );
  if (!strategy.success || !scaffold.success) {
    portal(actor.role, "invalid-next-support");
  }
  const cycle = await cycleForMembership(
    actor.schoolId,
    "teacherMembershipId",
    actor.membershipId,
  );
  if (!cycle) portal(actor.role, "cycle-missing");
  const recorded = await db.$transaction(async (transaction) => {
    const updated = await transaction.learningCycle.updateMany({
      where: {
        id: cycle.id,
        teacherMembershipId: actor.membershipId,
        status: CycleStatus.waiting_teacher_review,
        revisedAnswer: { not: null },
        explanationChoice: { not: null },
        artifactRevision: { not: null },
      },
      data: {
        teacherReviewStatus: ReviewStatus.reviewed,
        nextSupport: strategy.data,
        nextScaffoldLevel: scaffold.data,
        familyBriefApproved: true,
        status: CycleStatus.waiting_family,
        reviewedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) return false;
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "cycle.family_brief_approved",
        entityType: "learning_cycle",
        entityId: cycle.id,
        metadata: {
          nextSupport: strategy.data,
          nextScaffoldLevel: scaffold.data,
        },
      },
    });
    return true;
  });
  if (!recorded) portal(actor.role, "review-not-ready");
  portal(actor.role, "family-brief-approved");
}

export async function recordFamilyResponseAction(formData: FormData): Promise<never> {
  const actor = await requireActor(SchoolRole.parent);
  const response = FamilyResponseSchema.exclude(["not_sent"]).safeParse(
    formData.get("response"),
  );
  if (!response.success) portal(actor.role, "choose-response");
  const cycle = await cycleForMembership(
    actor.schoolId,
    "guardianMembershipId",
    actor.membershipId,
  );
  if (!cycle) portal(actor.role, "cycle-missing");
  const recorded = await db.$transaction(async (transaction) => {
    const updated = await transaction.learningCycle.updateMany({
      where: {
        id: cycle.id,
        guardianMembershipId: actor.membershipId,
        status: CycleStatus.waiting_family,
        familyBriefApproved: true,
        familyResponse: FamilyResponse.not_sent,
      },
      data: {
        familyResponse: response.data,
        familyRespondedAt: new Date(),
        status: CycleStatus.complete,
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) return false;
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "cycle.family_response_recorded",
        entityType: "learning_cycle",
        entityId: cycle.id,
        metadata: { response: response.data },
      },
    });
    return true;
  });
  if (!recorded) portal(actor.role, "response-already-sent");
  portal(actor.role, "response-sent");
}

export async function startFreshCycleAction(): Promise<never> {
  const actor = await requireActor(SchoolRole.school_admin);
  const cycle = await db.learningCycle.findFirst({
    where: {
      schoolId: actor.schoolId,
      status: { not: CycleStatus.archived },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!cycle) portal(actor.role, "cycle-missing");
  if (cycle.status === CycleStatus.draft) portal(actor.role, "cycle-ready");

  const inheritedSupport = cycle.nextSupport ?? cycle.selectedSupport;
  const support = PROJECT_AUTHORED_SUPPORTS[inheritedSupport];
  await db.$transaction(async (transaction) => {
    const archived = await transaction.learningCycle.updateMany({
      where: {
        id: cycle.id,
        schoolId: actor.schoolId,
        status: { notIn: [CycleStatus.draft, CycleStatus.archived] },
      },
      data: {
        status: CycleStatus.archived,
        version: { increment: 1 },
      },
    });
    if (archived.count !== 1) throw new Error("cycle-state-changed");

    const nextCycle = await transaction.learningCycle.create({
      data: {
        schoolId: actor.schoolId,
        teacherMembershipId: cycle.teacherMembershipId,
        studentMembershipId: cycle.studentMembershipId,
        guardianMembershipId: cycle.guardianMembershipId,
        title: cycle.title,
        subject: cycle.subject,
        gradeLabel: cycle.gradeLabel,
        goal: cycle.goal,
        familyLocale: cycle.familyLocale,
        planOrigin: ContentOrigin.project_authored,
        aiStatus: AiStatus.not_requested,
        planSuccessCriteria: PROJECT_AUTHORED_PLAN.successCriteria,
        planLearningSequence: PROJECT_AUTHORED_PLAN.learningSequence,
        misconceptionIds: PROJECT_AUTHORED_PLAN.misconceptionIds,
        quickCheck: PROJECT_AUTHORED_PLAN.quickCheck,
        familyDraft: PROJECT_AUTHORED_PLAN.familyDraft,
        planAgencyMove: PROJECT_AUTHORED_PLAN.agencyMove,
        sourceSectionIds: PROJECT_AUTHORED_PLAN.sourceSectionIds,
        selectedSupport: inheritedSupport,
        scaffoldLevel: cycle.nextScaffoldLevel ?? cycle.scaffoldLevel,
        supportOrigin: ContentOrigin.project_authored,
        supportExplanation: support.explanation,
        supportThinkingPrompts: support.thinkingPrompts,
        supportHandoffPrompt: support.handoffPrompt,
        supportSourceIds: support.sourceSectionIds,
        teacherReviewStatus: ReviewStatus.pending,
        familyResponse: FamilyResponse.not_sent,
      },
    });
    await transaction.auditEvent.create({
      data: {
        schoolId: actor.schoolId,
        actorUserId: actor.userId,
        action: "cycle.created_from_archived_goal",
        entityType: "learning_cycle",
        entityId: nextCycle.id,
        metadata: { archivedCycleId: cycle.id },
      },
    });
  });
  portal(actor.role, "cycle-created");
}
