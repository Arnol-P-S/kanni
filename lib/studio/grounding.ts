import type { CurriculumSectionRecord } from "@/lib/curriculum/rag";
import {
  containsDiagnosticObservation,
  inspectTextFields,
} from "@/lib/safety/input-guard";
import type { StudentThinkingCoach, TeacherPlan } from "@/lib/studio/contracts";

const invisibleOrReplacementCharacterPattern =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFFFC\uFFFD]/u;
const unsupportedWritingSystemPattern =
  /[^\p{Script=Latin}\p{Script=Malayalam}\p{Script=Greek}\p{M}\p{N}\p{P}\p{Z}\p{S}\n\r\t]/u;

export function generatedTextIsDisplaySafe(value: string): boolean {
  return (
    value === value.normalize("NFC") &&
    !invisibleOrReplacementCharacterPattern.test(value) &&
    !unsupportedWritingSystemPattern.test(value)
  );
}

function reachesDeclaredMaximum(
  fields: ReadonlyArray<readonly [value: string, maximum: number]>,
): boolean {
  return fields.some(([value, maximum]) => value.length >= maximum);
}

function teacherPlanReachesTextBoundary(plan: TeacherPlan): boolean {
  return reachesDeclaredMaximum([
    [plan.overview, 320],
    ...plan.successCriteria.map((value) => [value, 180] as const),
    ...plan.learningSequence.flatMap((item) => [
      [item.title, 80] as const,
      [item.teacherMove, 280] as const,
      [item.learnerMove, 280] as const,
    ]),
    ...plan.differentiation.flatMap((item) => [
      [item.teacherMove, 300] as const,
      [item.learnerChoice, 220] as const,
    ]),
    ...plan.misconceptions.flatMap((item) => [
      [item.ideaToCheck, 220] as const,
      [item.probe, 240] as const,
      [item.teacherResponse, 280] as const,
    ]),
    ...plan.quickChecks.flatMap((item) => [
      [item.prompt, 260] as const,
      [item.evidenceToNotice, 240] as const,
    ]),
    ...plan.interestHooks.flatMap((item) => [
      [item.title, 70] as const,
      [item.prompt, 260] as const,
    ]),
    ...plan.makerChoices.flatMap((item) => [
      [item.title, 80] as const,
      [item.prompt, 320] as const,
      ...item.constraints.map((value) => [value, 140] as const),
      [item.evidenceToCapture, 220] as const,
    ]),
    ...plan.socraticPrompts.map((value) => [value, 220] as const),
    ...plan.reflectionPrompts.map((value) => [value, 220] as const),
    [plan.familyActivity, 700],
  ]);
}

function studentHelpReachesTextBoundary(help: StudentThinkingCoach): boolean {
  return reachesDeclaredMaximum([
    [help.opening, 180],
    ...help.creativeSteps.flatMap((item) => [
      [item.title, 70] as const,
      [item.question, 220] as const,
      [item.tryThis, 220] as const,
    ]),
    [help.selfCheck, 220],
  ]);
}

export function planCitationGroups(plan: TeacherPlan): string[][] {
  return [
    plan.sourceSectionIds,
    ...plan.learningSequence.map((item) => item.sourceSectionIds),
    ...plan.differentiation.map((item) => item.sourceSectionIds),
    ...plan.misconceptions.map((item) => item.sourceSectionIds),
    ...plan.quickChecks.map((item) => item.sourceSectionIds),
  ];
}

export function uniquePlanCitationIds(plan: TeacherPlan): string[] {
  return [...new Set(planCitationGroups(plan).flat())];
}

export function teacherPlanCitationsAreValid(
  plan: TeacherPlan,
  allowedSections: readonly Pick<CurriculumSectionRecord, "referenceId">[],
): boolean {
  const allowed = new Set(allowedSections.map((section) => section.referenceId));
  const declared = new Set(plan.sourceSectionIds);

  return planCitationGroups(plan).every(
    (group) =>
      group.length > 0 &&
      new Set(group).size === group.length &&
      group.every((id) => allowed.has(id) && declared.has(id)),
  );
}

export function teacherPlanTextValues(plan: TeacherPlan): string[] {
  return [
    plan.overview,
    ...plan.successCriteria,
    ...plan.learningSequence.flatMap((item) => [item.title, item.teacherMove, item.learnerMove]),
    ...plan.differentiation.flatMap((item) => [item.teacherMove, item.learnerChoice]),
    ...plan.misconceptions.flatMap((item) => [item.ideaToCheck, item.probe, item.teacherResponse]),
    ...plan.quickChecks.flatMap((item) => [item.prompt, item.evidenceToNotice]),
    ...plan.interestHooks.flatMap((item) => [item.title, item.prompt]),
    ...plan.makerChoices.flatMap((item) => [
      item.title,
      item.prompt,
      ...item.constraints,
      item.evidenceToCapture,
    ]),
    ...plan.socraticPrompts,
    ...plan.reflectionPrompts,
    plan.familyActivity,
  ];
}

export function teacherPlanIsSafeForReview(plan: TeacherPlan): boolean {
  const textValues = teacherPlanTextValues(plan);
  return (
    inspectTextFields(textValues).status === "clear" &&
    !textValues.some(containsDiagnosticObservation) &&
    textValues.every(generatedTextIsDisplaySafe) &&
    !teacherPlanReachesTextBoundary(plan)
  );
}

export function studentHelpCitationsAreValid(
  help: StudentThinkingCoach,
  allowedSections: readonly Pick<CurriculumSectionRecord, "referenceId">[],
): boolean {
  const allowed = new Set(allowedSections.map((section) => section.referenceId));
  const declared = new Set(help.sourceSectionIds);
  const groups = [
    help.sourceSectionIds,
    ...help.creativeSteps.map((step) => step.sourceSectionIds),
  ];
  return groups.every(
    (group) =>
      group.length > 0 &&
      new Set(group).size === group.length &&
      group.every((id) => allowed.has(id) && declared.has(id)),
  );
}

export function studentHelpTextValues(help: StudentThinkingCoach): string[] {
  return [
    help.opening,
    ...help.creativeSteps.flatMap((step) => [step.title, step.question, step.tryThis]),
    help.selfCheck,
  ];
}

const answerRevealingPattern =
  /\b(?:the|your|correct|final)\s+(?:answer|solution)\s+(?:is|equals)|\b(?:copy|write)\s+(?:this|exactly)|\bchoose\s+(?:option|answer)\b/iu;

export function studentHelpPreservesAgency(help: StudentThinkingCoach): boolean {
  if (studentHelpTextValues(help).some((value) => answerRevealingPattern.test(value))) {
    return false;
  }
  return help.creativeSteps.every((step) => step.question.trim().endsWith("?"));
}

export function studentHelpIsSafe(help: StudentThinkingCoach): boolean {
  const textValues = studentHelpTextValues(help);
  return (
    inspectTextFields(textValues).status === "clear" &&
    !textValues.some(containsDiagnosticObservation) &&
    textValues.every(generatedTextIsDisplaySafe) &&
    !studentHelpReachesTextBoundary(help) &&
    studentHelpPreservesAgency(help)
  );
}
