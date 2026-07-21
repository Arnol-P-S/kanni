import "dotenv/config";

import { writeFile } from "node:fs/promises";

import { generateGroundedTeacherPlan } from "../lib/ai/studio-ai";
import { splitCurriculumIntoSections } from "../lib/curriculum/rag";

const confirmation = process.env.RUN_LIVE_AI_EVALS;
if (confirmation !== "I_UNDERSTAND_THIS_SPENDS_OPENROUTER_CREDIT") {
  throw new Error(
    "Live eval stopped before any request. Set RUN_LIVE_AI_EVALS=I_UNDERSTAND_THIS_SPENDS_OPENROUTER_CREDIT to permit one OpenRouter call.",
  );
}

const sections = splitCurriculumIntoSections(`
Equivalent ratios
Equivalent ratios describe the same multiplicative relationship. In a ratio table, each pair of corresponding values is multiplied or divided by the same factor.

Unit rates
A unit rate compares a quantity with one unit. A vehicle travelling 120 kilometres in two hours has a unit rate of 60 kilometres per hour.

Claims and evidence
A strong mathematical explanation states a claim, gives relevant evidence, and explains the connection. A learner should revise a claim when a test or source example does not support it.

Learning through revision
Begin with a prediction. Build or represent the idea, test it, identify one weakness, revise the work, and explain why the revision is stronger.
`);

const result = await generateGroundedTeacherPlan({
  title: "Ratios as relationships",
  subject: "Mathematics",
  gradeLabel: "Class 7",
  goal: "Compare equivalent ratios and justify the comparison with a table or model.",
  drivingQuestion: "How can we prove that two ratios describe the same relationship?",
  familyLocale: "en",
  sections,
});

const report = {
  runDate: new Date().toISOString(),
  suiteVersion: "teacher-agency-rag-live-v1",
  requestCount: 1,
  status: result.status,
  model: result.model,
  promptVersion: result.promptVersion,
  inputTokens: result.inputTokens,
  outputTokens: result.outputTokens,
  costMicros: result.costMicros,
  latencyMs: result.latencyMs,
  citationIds: result.citationIds,
  checks: {
    structuredPlanReturned: result.plan !== null,
    validSourceIds: result.citationIds.every((id) =>
      sections.some((section) => section.referenceId === id),
    ),
    createCritiqueRevisePresent: Boolean(
      result.plan?.learningSequence.some((step) => step.phase === "make") &&
        result.plan.learningSequence.some((step) => step.phase === "explain") &&
        result.plan.reflectionPrompts.length >= 2,
    ),
  },
};

await writeFile("eval/live-results.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Kanni live evaluation: ${result.status}; one request recorded.`);
if (
  result.status !== "succeeded" ||
  !report.checks.validSourceIds ||
  !report.checks.createCritiqueRevisePresent
) {
  process.exitCode = 1;
}
