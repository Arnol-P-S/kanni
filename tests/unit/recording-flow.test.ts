import { describe, expect, it } from "vitest";

import { splitCurriculumIntoSections } from "@/lib/curriculum/rag";
import {
  applyRainwaterRecordingReview,
  rainwaterRecordingFlow,
  recordingStudioReplacementScope,
} from "@/lib/recording/rainwater-flow";
import { inspectTextFields } from "@/lib/safety/input-guard";
import {
  CurriculumPackInputSchema,
  LearnerSubmissionSchema,
  StudentThinkingCoachSchema,
  TeacherReviewInputSchema,
} from "@/lib/studio/contracts";
import {
  studentHelpIsSafe,
  teacherPlanIsSafeForReview,
} from "@/lib/studio/grounding";
import { createTeacherStarterPlan } from "@/lib/studio/plan";

describe("saved recording flow", () => {
  it("uses a valid original curriculum pack with stable grounded sections", () => {
    const parsedPack = CurriculumPackInputSchema.parse({
      ...rainwaterRecordingFlow.pack,
      rightsBasis: "original",
      sourceUrl: "",
      locale: "en",
      rightsConfirmed: "yes",
    });
    const firstPass = splitCurriculumIntoSections(parsedPack.sourceText);
    const secondPass = splitCurriculumIntoSections(parsedPack.sourceText);

    expect(firstPass).toHaveLength(6);
    expect(firstPass.map(({ referenceId }) => referenceId)).toEqual([
      "SEC-001",
      "SEC-002",
      "SEC-003",
      "SEC-004",
      "SEC-005",
      "SEC-006",
    ]);
    expect(firstPass.map(({ checksum }) => checksum)).toEqual(
      secondPass.map(({ checksum }) => checksum),
    );
  });

  it("keeps the prepared learner evidence inside the live submission contract", () => {
    const parsedSubmission = LearnerSubmissionSchema.parse({
      interestHookIndex: 0,
      makerChoiceId: "make_recording_path",
      ...rainwaterRecordingFlow.learnerWork,
      supportOpened: true,
    });

    expect(parsedSubmission.firstDraft).toContain("16,080 litres");
    expect(parsedSubmission.revision).toContain("12,800 litres");
    expect(parsedSubmission.reflection).toContain("less help");
  });

  it("keeps teacher and family copy clear of blocked personal or high-risk data", () => {
    TeacherReviewInputSchema.parse({
      ...rainwaterRecordingFlow.teacherReview,
      nextScaffoldLevel: "light",
      reviewedEvidence: "yes",
    });

    const result = inspectTextFields(
      [
        rainwaterRecordingFlow.pack.sourceText,
        ...Object.values(rainwaterRecordingFlow.learnerWork),
        ...Object.values(rainwaterRecordingFlow.teacherReview),
        rainwaterRecordingFlow.familyResponse.note,
      ],
      { aiBound: true },
    );

    expect(result).toEqual({ status: "clear" });
  });

  it("replaces only studios named by the recording audit trail", () => {
    const scope = recordingStudioReplacementScope("school-one", [
      { entityId: "studio-recording-a" },
      { entityId: "studio-recording-a" },
      { entityId: "studio-recording-b" },
    ]);

    expect(scope).toEqual({
      schoolId: "school-one",
      id: { in: ["studio-recording-a", "studio-recording-b"] },
    });
    expect(scope).not.toHaveProperty("title");
  });

  it("applies the documented human review and passes the stricter display gate", () => {
    const sections = splitCurriculumIntoSections(
      rainwaterRecordingFlow.pack.sourceText,
    );
    const plan = createTeacherStarterPlan({
      goal: rainwaterRecordingFlow.studio.goal,
      drivingQuestion: rainwaterRecordingFlow.studio.drivingQuestion,
      familyLocale: "en",
      sections,
    });
    plan.overview = `Rainwater plan ${"\uFFFC".repeat(300)}`;
    plan.successCriteria[0] =
      `I can compare expected collection with storage capacity ${"\uFFFC".repeat(100)}`;
    plan.learningSequence[0].title = "What would make an estimate trustworthy?";
    plan.learningSequence[0].teacherMove = "Show supplied figures, then ask what they-";
    plan.learningSequence[2].title = "Prototype a safe collection plan";
    plan.learningSequence[2].teacherMove = "Make a model, not installation permissionén";
    plan.socraticPrompts[0] =
      `What would make your overflow claim trustworthy?${"\uFFFC".repeat(100)}`;
    plan.reflectionPrompts[0] =
      `What could the water support, and what remains uncertain?${"\uFFFC".repeat(100)}`;

    const help = StudentThinkingCoachSchema.parse({
      schemaVersion: "student-thinking-coach-v1",
      opening: "Your first estimate gives you useful evidence to test.",
      creativeSteps: [
        {
          title: "Check units",
          question: "Which unit belongs beside each number?",
          tryThis: "Rewrite one calculation with every unit visible.",
          sourceSectionIds: ["SEC-001"],
        },
        {
          title: "Mark assumptions",
          question: "Which value is an assumption rather than a measurement?",
          tryThis: "Label each number as measured, supplied, or assumed.",
          sourceSectionIds: ["SEC-002"],
        },
        {
          title: "Trace overflow",
          question: "Where should excess water move when storage is full?",
          tryThis: "Draw a safe overflow route away from paths and buildings.",
          sourceSectionIds: ["SEC-004"],
        },
      ],
      selfCheck: "Check units, capacity, and safe- 배",
      sourceSectionIds: ["SEC-001", "SEC-002", "SEC-004"],
    });

    const reviewed = applyRainwaterRecordingReview(plan, help);

    expect(reviewed.plan.overview).not.toContain("\uFFFC");
    expect(reviewed.help.selfCheck).toContain("without AI");
    expect(teacherPlanIsSafeForReview(reviewed.plan)).toBe(true);
    expect(studentHelpIsSafe(reviewed.help)).toBe(true);
  });
});
