import "dotenv/config";

import { Prisma } from "@prisma/client";

import { db } from "../lib/db";
import {
  applyRainwaterRecordingReview,
  RECORDING_FLOW_KEY,
  RECORDING_REVIEWED_FIELD_PATHS,
  rainwaterRecordingFlow,
} from "../lib/recording/rainwater-flow";
import {
  StudentThinkingCoachSchema,
  TeacherPlanSchema,
} from "../lib/studio/contracts";
import {
  studentHelpCitationsAreValid,
  studentHelpIsSafe,
  teacherPlanCitationsAreValid,
  teacherPlanIsSafeForReview,
} from "../lib/studio/grounding";

const requiredConfirmation =
  "I_UNDERSTAND_THIS_APPLIES_REVIEWED_AI_OUTPUT_CORRECTIONS";
if (process.env.KANNI_RECORDING_REVIEW_CONFIRMATION !== requiredConfirmation) {
  throw new Error(
    `Recording review stopped. Set KANNI_RECORDING_REVIEW_CONFIRMATION=${requiredConfirmation} to apply the seven documented text corrections without making an AI request.`,
  );
}

const recordingEvent = await db.auditEvent.findFirst({
  where: {
    action: "recording.studio_completed",
    entityType: "learning_studio",
    metadata: { path: ["recordingFlow"], equals: RECORDING_FLOW_KEY },
  },
  select: { schoolId: true, entityId: true },
  orderBy: { createdAt: "desc" },
});
if (!recordingEvent) {
  throw new Error("No audit-tagged recording flow is available for review.");
}

const studio = await db.learningStudio.findFirst({
  where: {
    id: recordingEvent.entityId,
    schoolId: recordingEvent.schoolId,
    title: rainwaterRecordingFlow.studio.title,
  },
  select: {
    id: true,
    schoolId: true,
    plan: true,
    aiModel: true,
    planPromptVersion: true,
    teacherMembership: { select: { userId: true } },
    curriculumPack: {
      select: {
        sections: {
          select: {
            referenceId: true,
            heading: true,
            content: true,
            position: true,
            checksum: true,
          },
          orderBy: { position: "asc" },
        },
      },
    },
    studentHelp: {
      select: { id: true, response: true, model: true, promptVersion: true },
    },
  },
});
if (!studio?.studentHelp) {
  throw new Error("The audit-tagged recording flow does not contain student help.");
}
const storedStudentHelp = studio.studentHelp;

const parsedPlan = TeacherPlanSchema.safeParse(studio.plan);
const parsedHelp = StudentThinkingCoachSchema.safeParse(storedStudentHelp.response);
if (!parsedPlan.success || !parsedHelp.success) {
  throw new Error("The stored recording outputs no longer match their structured contracts.");
}

const reviewed = applyRainwaterRecordingReview(parsedPlan.data, parsedHelp.data);
const sections = studio.curriculumPack.sections;
if (
  !teacherPlanCitationsAreValid(reviewed.plan, sections) ||
  !studentHelpCitationsAreValid(reviewed.help, sections) ||
  !teacherPlanIsSafeForReview(reviewed.plan) ||
  !studentHelpIsSafe(reviewed.help)
) {
  throw new Error("The reviewed recording output did not pass grounding, safety, or display checks.");
}

await db.$transaction(async (transaction) => {
  await transaction.learningStudio.update({
    where: { id: studio.id },
    data: {
      plan: reviewed.plan as Prisma.InputJsonValue,
      planReviewedAt: new Date(),
      version: { increment: 1 },
    },
  });
  await transaction.studentHelp.update({
    where: { id: storedStudentHelp.id },
    data: { response: reviewed.help as Prisma.InputJsonValue },
  });
  await transaction.auditEvent.create({
    data: {
      schoolId: studio.schoolId,
      actorUserId: studio.teacherMembership.userId,
      action: "recording.ai_output_human_reviewed",
      entityType: "learning_studio",
      entityId: studio.id,
      metadata: {
        recordingFlow: RECORDING_FLOW_KEY,
        reason: "malformed_provider_glyphs",
        correctedFields: [...RECORDING_REVIEWED_FIELD_PATHS],
        teacherModel: studio.aiModel,
        teacherPromptVersion: studio.planPromptVersion,
        studentModel: storedStudentHelp.model,
        studentPromptVersion: storedStudentHelp.promptVersion,
      },
    },
  });
});

console.log(
  JSON.stringify(
    {
      status: "reviewed",
      recordingFlow: RECORDING_FLOW_KEY,
      correctedFields: RECORDING_REVIEWED_FIELD_PATHS.length,
      aiRequests: 0,
    },
    null,
    2,
  ),
);
