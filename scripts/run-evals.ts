import { writeFile } from "node:fs/promises";

import { deterministicEvalCases } from "../eval/cases";
import {
  citationsMatchRetrievedSections,
  retrieveCurriculumSections,
  splitCurriculumIntoSections,
} from "../lib/curriculum/rag";
import { roleCan, roleCanSee } from "../lib/permissions";
import { inspectUserText } from "../lib/safety/input-guard";
import { createTeacherStarterPlan } from "../lib/studio/plan";
import {
  canTransitionStudio,
  nextScaffoldSuggestion,
  promptsForScaffold,
} from "../lib/studio/workflow";

const curriculum = splitCurriculumIntoSections(`
Equivalent ratio tables
An equivalent ratio table keeps the same multiplicative relationship in every row. Compare corresponding values, not only the size of one number.

Unit rates
A unit rate tells how much there is for one unit. If a vehicle covers 120 kilometres in two hours, its unit rate is 60 kilometres per hour.

Claims and evidence
A claim needs relevant evidence. A strong explanation states the claim, points to exact evidence, and explains the connection. Critique a claim by checking whether its evidence is sufficient.

അനുപാത പട്ടിക
തുല്യ അനുപാത പട്ടികയിലെ ഓരോ വരിയിലും ഒരേ ഗുണനബന്ധം നിലനിൽക്കും. സംഖ്യകളുടെ വലുപ്പം മാത്രം നോക്കാതെ ബന്ധപ്പെട്ട മൂല്യങ്ങൾ താരതമ്യം ചെയ്യുക.
`);

const plan = createTeacherStarterPlan({
  goal: "Compare equivalent ratios and explain the multiplicative relationship with evidence.",
  drivingQuestion: "How can a table show that two ratios describe the same relationship?",
  familyLocale: "en",
  sections: curriculum,
});

function evaluate(item: (typeof deterministicEvalCases)[number]): boolean {
  switch (item.kind) {
    case "retrieval": {
      const ids = retrieveCurriculumSections(curriculum, item.query).map(
        (section) => section.referenceId,
      );
      return item.expectedIds.length === 0
        ? ids.length === 0
        : item.expectedIds.every((id) => ids.includes(id));
    }
    case "grounding":
      return (
        citationsMatchRetrievedSections(
          item.citationIds,
          item.retrievedIds.map((referenceId) => ({ referenceId })),
        ) === item.expected
      );
    case "agency": {
      const checks = {
        guided_prompts: promptsForScaffold(plan, "guided").length === 3,
        light_prompts: promptsForScaffold(plan, "light").length === 1,
        independent_prompts: promptsForScaffold(plan, "independent").length === 0,
        fade_after_independent_work:
          nextScaffoldSuggestion("guided", false) === "light",
        hold_after_support: nextScaffoldSuggestion("guided", true) === "guided",
        fade_light_to_independent:
          nextScaffoldSuggestion("light", false) === "independent",
        prompts_do_not_give_answer: plan.socraticPrompts.every(
          (prompt) =>
            prompt.endsWith("?") &&
            !/the answer is|choose this answer|copy this/iu.test(prompt),
        ),
      };
      return checks[item.check];
    }
    case "safety":
      return inspectUserText(item.text, { aiBound: item.aiBound }).status === item.expected;
    case "authorization":
      return roleCan(item.role, item.capability) === item.expected;
    case "privacy":
      return roleCanSee(item.role, item.information) === item.expected;
    case "workflow":
      return canTransitionStudio(item.current, item.next) === item.expected;
    case "scaffold":
      return nextScaffoldSuggestion(item.current, item.supportOpened) === item.expected;
  }
}

const results = deterministicEvalCases.map((item) => ({
  id: item.id,
  category: item.category,
  passed: evaluate(item),
}));
const passed = results.filter((item) => item.passed).length;
const report = {
  runDate: new Date().toISOString(),
  suiteVersion: "teacher-first-agency-rag-v2",
  totals: { total: results.length, passed, failed: results.length - passed },
  results,
};

await writeFile(
  "eval/deterministic-results.json",
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(`Kanni deterministic evaluation: ${passed}/${results.length} passed.`);
if (passed !== results.length) process.exitCode = 1;
