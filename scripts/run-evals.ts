import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { evalCases } from "../eval/cases";
import { TutorRequestSchema } from "../lib/domain";
import {
  getGuidedAttempt,
  getGuidedHintContext,
} from "../lib/math-activity-strategies";
import { TUTOR_PROMPT_VERSION } from "../lib/ai/prompt";
import { lessonPacks } from "../lib/lessons";
import { classifyPrompt } from "../lib/safety";

const results = evalCases.map((item) => {
  const parsed = TutorRequestSchema.safeParse(item.request);
  if (!parsed.success) {
    return {
      id: item.id,
      category: item.category,
      expectedRoute: item.expectedRoute,
      actualRoute: "invalid_request",
      passed: false,
    };
  }

  const request = parsed.data;
  const guidedAttempt =
    request.mode === "guided_hint"
      ? getGuidedAttempt(request.questionId, request.selectedAnswerId)
      : null;
  if (request.mode === "guided_hint" && !guidedAttempt) {
    return {
      id: item.id,
      category: item.category,
      expectedRoute: item.expectedRoute,
      actualRoute: "invalid_guided_attempt",
      passed: false,
    };
  }

  const prompt =
    request.mode === "custom_question"
      ? request.prompt
      : getGuidedHintContext(request.questionId).question[request.language];
  const actualRoute = classifyPrompt(request.lessonId, prompt);
  return {
    id: item.id,
    category: item.category,
    expectedRoute: item.expectedRoute,
    actualRoute,
    passed: actualRoute === item.expectedRoute,
  };
});

const failed = results.filter((result) => !result.passed);
const runDate = new Date().toISOString();
const categorySummary = results.reduce<
  Record<string, { passed: number; total: number }>
>((summary, result) => {
  const current = summary[result.category] ?? { passed: 0, total: 0 };
  return {
    ...summary,
    [result.category]: {
      passed: current.passed + (result.passed ? 1 : 0),
      total: current.total + 1,
    },
  };
}, {});

process.stdout.write("Kanni deterministic eval preflight\n");
process.stdout.write(`Prompt version: ${TUTOR_PROMPT_VERSION}\n`);
process.stdout.write(
  `Content versions: ${Object.values(lessonPacks)
    .map((lesson) => lesson.version)
    .join(", ")}\n`,
);
process.stdout.write(`Run date: ${runDate}\n\n`);
for (const [category, summary] of Object.entries(categorySummary)) {
  process.stdout.write(
    `${category.padEnd(20)} ${summary.passed}/${summary.total} passed\n`,
  );
}
process.stdout.write(
  `\nTotal: ${results.length - failed.length}/${results.length} passed\n`,
);

writeFileSync(
  resolve(process.cwd(), "eval/deterministic-results.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      kind: "deterministic_preflight",
      runDate,
      promptVersion: TUTOR_PROMPT_VERSION,
      lessonPackVersions: Object.values(lessonPacks).map(
        (lesson) => lesson.version,
      ),
      modelCallsMade: false,
      totals: {
        passed: results.length - failed.length,
        total: results.length,
        failed: failed.length,
      },
      categories: categorySummary,
      results,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

if (failed.length > 0) {
  process.stderr.write("\nFailures:\n");
  for (const failure of failed) {
    process.stderr.write(
      `${failure.id}: expected ${failure.expectedRoute}, received ${failure.actualRoute}\n`,
    );
  }
  process.exitCode = 1;
}
