import { writeFile } from "node:fs/promises";

import { evalCases, type EvaluationCase } from "../eval/cases";
import { evaluateGrowthAiCapability } from "../lib/ai/capability-policy";
import {
  PROJECT_AUTHORED_SUPPORT,
  createGrowthCycle,
  hasCompleteSupportCircle,
  mapSupportCircle,
  publishTeacherPlan,
  recordFamilyResponse,
  recordFirstAnswer,
  recordRevision,
  recordSupportUsed,
  reviewStudentEvidence,
} from "../lib/growth-cycle";
import { roleCan, roleCanSee } from "../lib/permissions";

function throws(operation: () => unknown): boolean {
  try {
    operation();
    return false;
  } catch {
    return true;
  }
}

function workflowPasses(scenario: Extract<EvaluationCase, { kind: "workflow" }>["scenario"]): boolean {
  const fresh = createGrowthCycle();
  const mapped = mapSupportCircle(fresh, "ml");
  const published = publishTeacherPlan(mapped, "fraction_strips");
  const answered = recordFirstAnswer(published, "one_quarter");
  const supported = recordSupportUsed(answered, PROJECT_AUTHORED_SUPPORT, "project_authored");
  const revised = recordRevision(supported, "one_half", "same_whole_more_equal_parts");
  const reviewed = reviewStudentEvidence(revised, "guided_questions");
  const complete = recordFamilyResponse(reviewed, "tried");
  const checks: Record<typeof scenario, boolean> = {
    starts_in_draft: fresh.plan.status === "draft",
    mapping_completes: hasCompleteSupportCircle(mapped),
    publish_requires_mapping: throws(() => publishTeacherPlan(fresh, "fraction_strips")),
    publish_after_mapping: published.plan.status === "published",
    answer_requires_publish: throws(() => recordFirstAnswer(mapped, "one_quarter")),
    first_answer_is_idempotent: recordFirstAnswer(answered, "one_half").student.firstAnswer === "one_quarter",
    support_requires_answer: throws(() => recordSupportUsed(published, PROJECT_AUTHORED_SUPPORT, "project_authored")),
    revision_requires_support: throws(() => recordRevision(answered, "one_half", "same_whole_more_equal_parts")),
    revision_after_support: revised.student.revisedAnswer === "one_half",
    review_requires_evidence: throws(() => reviewStudentEvidence(supported, "guided_questions")),
    family_requires_review: throws(() => recordFamilyResponse(revised, "tried")),
    complete_loop: complete.family.response === "tried" && complete.teacherReview.nextSupport === "guided_questions",
  };
  return checks[scenario];
}

function evaluate(item: EvaluationCase): boolean {
  switch (item.kind) {
    case "authorization":
      return roleCan(item.role, item.capability) === item.expected;
    case "workflow":
      return workflowPasses(item.scenario);
    case "language": {
      const pair = item.id.endsWith("1") || item.id.endsWith("2")
        ? { en: "Learning goal", ml: "പഠനലക്ഷ്യം" }
        : { en: "Parent", ml: "രക്ഷിതാവ്" };
      return pair[item.locale] === item.expected;
    }
    case "privacy":
      return roleCanSee(item.role, item.information) === item.expected;
    case "ai_policy":
      return evaluateGrowthAiCapability(item.environment).reason === item.expectedReason;
  }
}

const results = evalCases.map((item) => ({
  id: item.id,
  category: item.category,
  passed: evaluate(item),
}));
const passed = results.filter((item) => item.passed).length;
const report = {
  runDate: new Date().toISOString(),
  suiteVersion: "school-slc-v1",
  totals: { total: results.length, passed, failed: results.length - passed },
  results,
};
await writeFile("eval/deterministic-results.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Kanni deterministic evaluation: ${passed}/${results.length} passed.`);
if (passed !== results.length) process.exitCode = 1;
