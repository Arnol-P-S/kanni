import "dotenv/config";

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

import {
  generateGroundedStudentHelp,
  generateGroundedTeacherPlan,
} from "../lib/ai/studio-ai";
import {
  normalizeCurriculumText,
  splitCurriculumIntoSections,
} from "../lib/curriculum/rag";
import { db } from "../lib/db";
import {
  RECORDING_FLOW_KEY,
  rainwaterRecordingFlow,
  recordingStudioReplacementScope,
} from "../lib/recording/rainwater-flow";

const requiredConfirmation = "I_UNDERSTAND_THIS_CREATES_ONE_SYNTHETIC_RECORDING_FLOW";
if (process.env.KANNI_RECORDING_FLOW_CONFIRMATION !== requiredConfirmation) {
  throw new Error(
    `Recording preparation stopped. Set KANNI_RECORDING_FLOW_CONFIRMATION=${requiredConfirmation} to permit up to two paid AI requests and creation or replacement of one audit-tagged recording flow.`,
  );
}

const sourceText = normalizeCurriculumText(rainwaterRecordingFlow.pack.sourceText);
const sections = splitCurriculumIntoSections(sourceText);
if (sections.length < 5) {
  throw new Error("The recording curriculum did not produce enough grounded sections.");
}

const assignment = await db.teacherStudent.findFirst({
  where: {
    teacherMembership: { isActive: true, role: SchoolRole.teacher },
    studentMembership: {
      isActive: true,
      role: SchoolRole.student,
      studentGuardians: {
        some: { guardianMembership: { isActive: true, role: SchoolRole.parent } },
      },
    },
  },
  select: {
    teacherMembership: {
      select: { id: true, schoolId: true, userId: true },
    },
    studentMembership: {
      select: {
        id: true,
        schoolId: true,
        userId: true,
        studentGuardians: {
          where: { guardianMembership: { isActive: true, role: SchoolRole.parent } },
          select: {
            guardianMembership: {
              select: { id: true, schoolId: true, userId: true },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    },
  },
  orderBy: { createdAt: "asc" },
});

if (!assignment) {
  throw new Error(
    "Connect one active teacher, student, and parent before preparing the recording flow.",
  );
}

const guardian = assignment.studentMembership.studentGuardians[0]?.guardianMembership;
if (
  !guardian ||
  assignment.teacherMembership.schoolId !== assignment.studentMembership.schoolId ||
  guardian.schoolId !== assignment.teacherMembership.schoolId
) {
  throw new Error("The recording support circle must belong to one school.");
}

const schoolId = assignment.teacherMembership.schoolId;
const administrator = await db.membership.findFirst({
  where: { schoolId, role: SchoolRole.school_admin, isActive: true },
  select: { id: true, userId: true },
  orderBy: { createdAt: "asc" },
});
if (!administrator) {
  throw new Error("An active school administrator is required.");
}

const sourceChecksum = createHash("sha256").update(sourceText).digest("hex");
const existingPack = await db.curriculumPack.findFirst({
  where: {
    schoolId,
    title: rainwaterRecordingFlow.pack.title,
    version: rainwaterRecordingFlow.pack.version,
  },
  select: {
    id: true,
    checksum: true,
    sections: {
      select: { referenceId: true, checksum: true },
      orderBy: { position: "asc" },
    },
  },
});
const expectedSectionFingerprint = sections
  .map((section) => `${section.referenceId}:${section.checksum}`)
  .join("|");
const storedSectionFingerprint = existingPack?.sections
  .map((section) => `${section.referenceId}:${section.checksum}`)
  .join("|");
if (
  existingPack &&
  (existingPack.checksum !== sourceChecksum ||
    storedSectionFingerprint !== expectedSectionFingerprint)
) {
  throw new Error(
    "The named recording curriculum already exists with different content. Archive it or choose a new version before retrying.",
  );
}

const previousRecordingEvents = await db.auditEvent.findMany({
  where: {
    schoolId,
    action: "recording.studio_completed",
    entityType: "learning_studio",
    metadata: { path: ["recordingFlow"], equals: RECORDING_FLOW_KEY },
  },
  select: { entityId: true },
});
const replacementScope = recordingStudioReplacementScope(
  schoolId,
  previousRecordingEvents,
);

console.log("Preparing one grounded teacher plan and one bounded student thinking coach request.");
const teacherResult = await generateGroundedTeacherPlan({
  title: rainwaterRecordingFlow.studio.title,
  subject: rainwaterRecordingFlow.studio.subject,
  gradeLabel: rainwaterRecordingFlow.studio.gradeLabel,
  goal: rainwaterRecordingFlow.studio.goal,
  drivingQuestion: rainwaterRecordingFlow.studio.drivingQuestion,
  familyLocale: "en",
  sections,
});
if (teacherResult.status !== "succeeded" || !teacherResult.plan) {
  throw new Error(`Teacher planning request did not pass: ${teacherResult.errorCode}`);
}

const studentResult = await generateGroundedStudentHelp({
  subject: rainwaterRecordingFlow.studio.subject,
  gradeLabel: rainwaterRecordingFlow.studio.gradeLabel,
  goal: rainwaterRecordingFlow.studio.goal,
  drivingQuestion: rainwaterRecordingFlow.studio.drivingQuestion,
  firstDraft: rainwaterRecordingFlow.learnerWork.firstDraft,
  sections,
});
if (studentResult.status !== "succeeded" || !studentResult.help) {
  throw new Error(`Student thinking-coach request did not pass: ${studentResult.errorCode}`);
}

const teacherPlan = teacherResult.plan;
const studentHelp = studentResult.help;

const now = Date.now();
const atMinute = (minutesBeforeNow: number) =>
  new Date(now - minutesBeforeNow * 60_000);

const stored = await db.$transaction(async (transaction) => {
  if (replacementScope.id.in.length > 0) {
    await transaction.learningStudio.deleteMany({
      where: replacementScope,
    });
  }

  const pack = existingPack
    ? await transaction.curriculumPack.update({
        where: { id: existingPack.id },
        data: { status: CurriculumStatus.active },
      })
    : await transaction.curriculumPack.create({
        data: {
          schoolId,
          createdByMembershipId: administrator.id,
          title: rainwaterRecordingFlow.pack.title,
          subject: rainwaterRecordingFlow.pack.subject,
          gradeLabel: rainwaterRecordingFlow.pack.gradeLabel,
          version: rainwaterRecordingFlow.pack.version,
          rightsBasis: RightsBasis.original,
          locale: Locale.en,
          checksum: sourceChecksum,
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

  const studio = await transaction.learningStudio.create({
    data: {
      schoolId,
      teacherMembershipId: assignment.teacherMembership.id,
      studentMembershipId: assignment.studentMembership.id,
      guardianMembershipId: guardian.id,
      curriculumPackId: pack.id,
      title: rainwaterRecordingFlow.studio.title,
      subject: rainwaterRecordingFlow.studio.subject,
      gradeLabel: rainwaterRecordingFlow.studio.gradeLabel,
      goal: rainwaterRecordingFlow.studio.goal,
      drivingQuestion: rainwaterRecordingFlow.studio.drivingQuestion,
      status: StudioStatus.complete,
      familyLocale: Locale.en,
      planOrigin: ContentOrigin.gpt_5_6,
      aiStatus: AiStatus.ready,
      studentHelpStatus: AiStatus.ready,
      plan: teacherPlan as Prisma.InputJsonValue,
      planPromptVersion: teacherResult.promptVersion,
      aiModel: teacherResult.model,
      scaffoldLevel: ScaffoldLevel.guided,
      version: 7,
      planReviewedAt: atMinute(18),
      publishedAt: atMinute(17),
      evidenceSubmittedAt: atMinute(10),
      reviewedAt: atMinute(5),
      familyRespondedAt: atMinute(1),
    },
  });

  await transaction.learnerSubmission.create({
    data: {
      studioId: studio.id,
      interestHookIndex: 0,
      makerChoiceId: teacherPlan.makerChoices[0].id,
      prediction: rainwaterRecordingFlow.learnerWork.prediction,
      firstDraft: rainwaterRecordingFlow.learnerWork.firstDraft,
      selfCritique: rainwaterRecordingFlow.learnerWork.selfCritique,
      revision: rainwaterRecordingFlow.learnerWork.revision,
      explanation: rainwaterRecordingFlow.learnerWork.explanation,
      reflection: rainwaterRecordingFlow.learnerWork.reflection,
      supportOpened: true,
      submittedAt: atMinute(10),
    },
  });
  await transaction.studentHelp.create({
    data: {
      studioId: studio.id,
      studentMembershipId: assignment.studentMembership.id,
      response: studentHelp as Prisma.InputJsonValue,
      sourceSectionIds: studentResult.citationIds,
      model: studentResult.model,
      promptVersion: studentResult.promptVersion,
      createdAt: atMinute(12),
    },
  });
  await transaction.teacherReview.create({
    data: {
      studioId: studio.id,
      teacherMembershipId: assignment.teacherMembership.id,
      noticedStrength: rainwaterRecordingFlow.teacherReview.noticedStrength,
      studentFeedback: rainwaterRecordingFlow.teacherReview.studentFeedback,
      nextQuestion: rainwaterRecordingFlow.teacherReview.nextQuestion,
      nextScaffoldLevel: ScaffoldLevel.light,
      familyActivity: rainwaterRecordingFlow.teacherReview.familyActivity,
      createdAt: atMinute(5),
    },
  });
  await transaction.familyHandoff.create({
    data: {
      studioId: studio.id,
      activity: rainwaterRecordingFlow.teacherReview.familyActivity,
      response: FamilyResponse.tried,
      parentNote: rainwaterRecordingFlow.familyResponse.note,
      respondedAt: atMinute(1),
      createdAt: atMinute(5),
    },
  });
  await transaction.aiRun.createMany({
    data: [
      {
        schoolId,
        studioId: studio.id,
        actorMembershipId: assignment.teacherMembership.id,
        purpose: "teacher_plan",
        provider: "openrouter",
        model: teacherResult.model,
        status: AiRunStatus.succeeded,
        promptVersion: teacherResult.promptVersion,
        inputTokens: teacherResult.inputTokens,
        outputTokens: teacherResult.outputTokens,
        costMicros: teacherResult.costMicros,
        latencyMs: teacherResult.latencyMs,
        citationIds: teacherResult.citationIds,
        createdAt: atMinute(20),
      },
      {
        schoolId,
        studioId: studio.id,
        actorMembershipId: assignment.studentMembership.id,
        purpose: "student_thinking_help",
        provider: "openrouter",
        model: studentResult.model,
        status: AiRunStatus.succeeded,
        promptVersion: studentResult.promptVersion,
        inputTokens: studentResult.inputTokens,
        outputTokens: studentResult.outputTokens,
        costMicros: studentResult.costMicros,
        latencyMs: studentResult.latencyMs,
        citationIds: studentResult.citationIds,
        createdAt: atMinute(12),
      },
    ],
  });
  await transaction.auditEvent.createMany({
    data: [
      {
        schoolId,
        actorUserId: administrator.userId,
        action: "recording.curriculum_prepared",
        entityType: "curriculum_pack",
        entityId: pack.id,
        metadata: { recordingFlow: RECORDING_FLOW_KEY },
        createdAt: atMinute(22),
      },
      {
        schoolId,
        actorUserId: assignment.teacherMembership.userId,
        action: "recording.studio_completed",
        entityType: "learning_studio",
        entityId: studio.id,
        metadata: {
          recordingFlow: RECORDING_FLOW_KEY,
          requests: 2,
          sourceSections: sections.length,
        },
        createdAt: atMinute(1),
      },
    ],
  });

  return { studioId: studio.id, packId: pack.id };
});

const totalCostMicros =
  (teacherResult.costMicros ?? 0) + (studentResult.costMicros ?? 0);
console.log(
  JSON.stringify(
    {
      status: "ready",
      recordingFlow: RECORDING_FLOW_KEY,
      studioId: stored.studioId,
      curriculumPackId: stored.packId,
      curriculumSections: sections.length,
      aiRequests: 2,
      model: teacherResult.model,
      totalRecordedCostUsd: Number((totalCostMicros / 1_000_000).toFixed(6)),
    },
    null,
    2,
  ),
);
