import { describe, expect, it } from "vitest";

import { splitCurriculumIntoSections } from "@/lib/curriculum/rag";
import { createTeacherStarterPlan } from "@/lib/studio/plan";
import {
  CreateStudioInputSchema,
  StudentHelpRequestSchema,
} from "@/lib/studio/contracts";
import {
  canTransitionStudio,
  nextScaffoldSuggestion,
  planOriginLabel,
  promptsForScaffold,
} from "@/lib/studio/workflow";

const sections = splitCurriculumIntoSections(`
Evidence and explanation
A useful explanation connects a claim to exact evidence and explains the connection. A revision should respond to the evidence found during testing.

Testing an idea
Start with a prediction, test it using a relevant example, and revise the first idea when the evidence points elsewhere.
`);
const plan = createTeacherStarterPlan({
  goal: "Use source evidence to test and revise a claim about proportional relationships.",
  drivingQuestion: "How can evidence make an explanation more convincing?",
  familyLocale: "en",
  sections,
});

describe("agency-centered studio workflow", () => {
  it("accepts only HTTP source links", () => {
    const input = {
      studentMembershipId: "membership-123",
      title: "Ratio investigation",
      subject: "Mathematics",
      gradeLabel: "Class 7",
      goal: "Compare two ratios and justify whether they describe the same relationship.",
      drivingQuestion: "How can a table help us test whether two ratios are equivalent?",
      familyLocale: "en",
      packTitle: "Teacher-authored ratio notes",
      packVersion: "2026.1",
      rightsBasis: "original",
      sourceText: "Teacher-owned curriculum section. ".repeat(12),
      rightsConfirmed: "yes",
    };

    expect(
      CreateStudioInputSchema.safeParse({ ...input, sourceUrl: "https://example.org/notes" }).success,
    ).toBe(true);
    expect(CreateStudioInputSchema.safeParse({ ...input, sourceUrl: "" }).success).toBe(true);
    expect(
      CreateStudioInputSchema.safeParse({ ...input, sourceUrl: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(
      CreateStudioInputSchema.safeParse({ ...input, sourceUrl: "data:text/html,unsafe" }).success,
    ).toBe(false);
  });

  it("allows a teacher to select an administrator-managed curriculum pack", () => {
    const input = {
      studentMembershipId: "membership-123",
      title: "Ratio investigation",
      subject: "Mathematics",
      gradeLabel: "Class 7",
      goal: "Compare two ratios and justify whether they describe the same relationship.",
      drivingQuestion: "How can a table help us test whether two ratios are equivalent?",
      familyLocale: "en",
      sourceMode: "school_library",
      curriculumPackId: "curriculum-pack-123",
    };
    const result = CreateStudioInputSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(
      CreateStudioInputSchema.safeParse({
        ...input,
        curriculumPackId: "",
      }).success,
    ).toBe(false);
  });

  it("requires an adult-supervision confirmation for each student AI request", () => {
    const request = {
      studioId: "studio-12345",
      firstDraft:
        "I tried one representation and explained what I noticed, but I still need to test whether my comparison works in another example.",
    };

    expect(StudentHelpRequestSchema.safeParse(request).success).toBe(false);
    expect(
      StudentHelpRequestSchema.safeParse({
        ...request,
        adultSupervisionConfirmed: "yes",
      }).success,
    ).toBe(true);
  });

  it("requires create, critique, revise, and reflect moves", () => {
    expect(plan.makerChoices.length).toBeGreaterThanOrEqual(2);
    expect(plan.learningSequence.map((step) => step.phase)).toEqual(
      expect.arrayContaining(["make", "explain", "reflect"]),
    );
    expect(plan.reflectionPrompts.some((prompt) => /do alone/iu.test(prompt))).toBe(true);
  });

  it("reduces prompts as teacher-selected scaffold fades", () => {
    expect(promptsForScaffold(plan, "guided")).toHaveLength(3);
    expect(promptsForScaffold(plan, "light")).toHaveLength(1);
    expect(promptsForScaffold(plan, "independent")).toHaveLength(0);
  });

  it("suggests less support only after work without opening support", () => {
    expect(nextScaffoldSuggestion("guided", false)).toBe("light");
    expect(nextScaffoldSuggestion("guided", true)).toBe("guided");
    expect(nextScaffoldSuggestion("light", false)).toBe("independent");
  });

  it("permits only the defined studio state transitions", () => {
    expect(canTransitionStudio("planning", "ready_for_student")).toBe(true);
    expect(canTransitionStudio("ready_for_student", "ready_for_family")).toBe(false);
    expect(canTransitionStudio("awaiting_teacher_review", "ready_for_family")).toBe(true);
    expect(canTransitionStudio("complete", "planning")).toBe(false);
  });

  it("does not claim an AI draft was reviewed before teacher confirmation", () => {
    expect(planOriginLabel("gpt_5_6", false)).toBe(
      "GPT-5.6 draft, awaiting teacher review",
    );
    expect(planOriginLabel("gpt_5_6", true)).toBe(
      "GPT-5.6 draft, teacher reviewed",
    );
    expect(planOriginLabel("teacher_authored", false)).toBe(
      "Teacher-owned starting plan",
    );
  });
});
