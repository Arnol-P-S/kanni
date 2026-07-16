import {
  CriticOutputSchema,
  TutorModelOutputSchema,
  type CriticOutput,
  type TutorRequest,
  type TutorResponse,
} from "@/lib/domain";
import { getLesson } from "@/lib/lessons";
import {
  containsGuidedAnswerLeak,
  getGuidedHintContext,
} from "@/lib/math-activity-strategies";
import {
  classifyPrompt,
  containsHighRiskContent,
  containsPersonalData,
} from "@/lib/safety";

const criticIssueCodes = {
  source: new Set(["missing_support", "citation_mismatch"]),
  teaching: new Set(["too_advanced", "unclear_step", "unsafe_tone"]),
} as const;

export function validateModelOutput(
  request: TutorRequest,
  untrustedOutput: unknown,
): TutorResponse {
  const output = TutorModelOutputSchema.parse(untrustedOutput);
  const lesson = getLesson(request.lessonId);
  const allowedSections = new Set(
    lesson.sections.map((section) => section.id),
  );
  if (
    output.sourceSectionIds.length === 0 ||
    output.sourceSectionIds.some((id) => !allowedSections.has(id))
  ) {
    throw new Error("The model returned an unknown lesson section ID.");
  }
  if (
    request.mode === "guided_hint" &&
    !output.sourceSectionIds.includes(
      getGuidedHintContext(request.questionId).focusSectionId,
    )
  ) {
    throw new Error("The guided hint did not cite its required lesson section.");
  }
  if (
    output.recommendedCheckId &&
    !lesson.allowedCheckIds.includes(output.recommendedCheckId)
  ) {
    throw new Error("The model returned an unknown check ID.");
  }
  if (
    output.possibleConfusionCode &&
    !lesson.allowedConfusionCodes.includes(output.possibleConfusionCode)
  ) {
    throw new Error("The model returned an unknown confusion code.");
  }
  if (
    request.lessonId === "math-add-within-10" &&
    (output.steps.length > 3 || output.explanation.length > 420)
  ) {
    throw new Error("The Class 1 answer exceeded the age-format limit.");
  }
  const generatedText = [
    output.explanation,
    ...output.steps,
    output.hint ?? "",
  ].join("\n");
  if (
    containsPersonalData(generatedText) ||
    containsHighRiskContent(generatedText)
  ) {
    throw new Error("The model returned content blocked by the safety screen.");
  }
  if (classifyPrompt(request.lessonId, generatedText) !== "generate") {
    throw new Error(
      "The model returned content outside the selected lesson boundary.",
    );
  }
  if (
    request.mode === "guided_hint" &&
    containsGuidedAnswerLeak(request.questionId, generatedText)
  ) {
    throw new Error("The guided hint revealed the correct answer.");
  }

  return {
    status: "grounded",
    explanation: output.explanation,
    steps: output.steps,
    hint: output.hint,
    recommendedCheckId: output.recommendedCheckId,
    sourceSectionIds: output.sourceSectionIds,
    possibleConfusionCode: output.possibleConfusionCode,
    trust: {
      sourceMatched: false,
      citationIdsValid: true,
      ageFormatChecked: true,
      safetyRoute: "clear",
      contentOrigin: "model_generated",
    },
    deepCheck: null,
  };
}

export function validateCriticOutput(
  kind: "source" | "teaching",
  untrustedOutput: unknown,
): CriticOutput {
  const output = CriticOutputSchema.parse(untrustedOutput);
  if (output.issueCodes.some((code) => !criticIssueCodes[kind].has(code))) {
    throw new Error("The critic returned an unknown issue code.");
  }
  if (output.result === "pass" && output.issueCodes.length > 0) {
    throw new Error("A passing critic cannot return issue codes.");
  }
  if (output.result === "warning" && output.issueCodes.length === 0) {
    throw new Error("A warning critic must return at least one issue code.");
  }
  return output;
}
