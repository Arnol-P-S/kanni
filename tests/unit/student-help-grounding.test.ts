import { describe, expect, it } from "vitest";

import { splitCurriculumIntoSections } from "@/lib/curriculum/rag";
import { StudentThinkingCoachSchema } from "@/lib/studio/contracts";
import {
  studentHelpCitationsAreValid,
  studentHelpIsSafe,
  studentHelpPreservesAgency,
} from "@/lib/studio/grounding";

const sections = splitCurriculumIntoSections(`
Testing a ratio
Compare both quantities with the same scale factor and use a table to test whether the relationship stays constant.

Revision
If the evidence does not match the prediction, revise the model and explain what changed.
`);

function validHelp() {
  return StudentThinkingCoachSchema.parse({
    schemaVersion: "student-thinking-coach-v1",
    opening: "Your first version gives you something useful to test.",
    creativeSteps: [
      {
        title: "Build a second row",
        question: "What happens when both quantities use the same multiplier?",
        tryThis: "Add one new row to the table and mark the multiplier beside each quantity.",
        sourceSectionIds: ["SEC-001"],
      },
      {
        title: "Look for a mismatch",
        question: "Which row changes only one quantity, if any?",
        tryThis: "Circle the pair that does not follow the same scale factor and explain why.",
        sourceSectionIds: ["SEC-001"],
      },
      {
        title: "Revise one choice",
        question: "What is the smallest change that makes the evidence match your claim?",
        tryThis: "Change one row, then write one sentence about why the new evidence is stronger.",
        sourceSectionIds: ["SEC-002"],
      },
    ],
    selfCheck: "Try a fresh pair of quantities without reopening AI help and explain the scale factor.",
    sourceSectionIds: ["SEC-001", "SEC-002"],
  });
}

describe("student thinking-coach output gate", () => {
  it("accepts creative steps that cite only retrieved curriculum sections", () => {
    const help = validHelp();
    expect(studentHelpCitationsAreValid(help, sections)).toBe(true);
    expect(studentHelpIsSafe(help)).toBe(true);
  });

  it("rejects invented citations and unsafe generated text", () => {
    const help = validHelp();
    help.creativeSteps[0].sourceSectionIds = ["SEC-999"];
    expect(studentHelpCitationsAreValid(help, sections)).toBe(false);

    const unsafe = validHelp();
    unsafe.opening = "Send your work to coach@example.com before continuing.";
    expect(studentHelpIsSafe(unsafe)).toBe(false);

    const malformed = validHelp();
    malformed.selfCheck = "Repeat the test without AI, then compare the result. 배";
    expect(studentHelpIsSafe(malformed)).toBe(false);

    const boundaryPadded = validHelp();
    boundaryPadded.selfCheck = "A".repeat(220);
    expect(studentHelpIsSafe(boundaryPadded)).toBe(false);
  });

  it("rejects schema-valid text that reveals an answer or stops asking questions", () => {
    const answerReveal = validHelp();
    answerReveal.creativeSteps[0].tryThis =
      "The final answer is one half. Copy this exactly into your work.";
    expect(studentHelpPreservesAgency(answerReveal)).toBe(false);
    expect(studentHelpIsSafe(answerReveal)).toBe(false);

    const noQuestion = validHelp();
    noQuestion.creativeSteps[0].question =
      "Compare both quantities using the same multiplier.";
    expect(studentHelpPreservesAgency(noQuestion)).toBe(false);
  });
});
