import { evalCases } from "../eval/cases";
import { classifyPrompt } from "../lib/safety";

const results = evalCases.map((item) => {
  const actualRoute = classifyPrompt(item.lessonId, item.prompt);
  return {
    id: item.id,
    category: item.category,
    expectedRoute: item.expectedRoute,
    actualRoute,
    passed: actualRoute === item.expectedRoute,
  };
});

const failed = results.filter((result) => !result.passed);
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
process.stdout.write("Prompt version: tutor-v1.0.0\n");
process.stdout.write("Content versions: math-1.0.0, cs-1.0.0\n");
process.stdout.write(`Run date: ${new Date().toISOString()}\n\n`);
for (const [category, summary] of Object.entries(categorySummary)) {
  process.stdout.write(
    `${category.padEnd(20)} ${summary.passed}/${summary.total} passed\n`,
  );
}
process.stdout.write(
  `\nTotal: ${results.length - failed.length}/${results.length} passed\n`,
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
