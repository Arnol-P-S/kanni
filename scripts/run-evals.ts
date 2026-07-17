import { writeFile } from "node:fs/promises";
import { SchoolRole } from "@prisma/client";

import { evalCases, type EvaluationCase } from "../eval/cases";
import { evaluateGrowthAiCapability } from "../lib/ai/capability-policy";
import { retrieveCurriculumSections } from "../lib/curriculum/fractions-foundation";
import {
  PROJECT_AUTHORED_SUPPORT,
  PROJECT_AUTHORED_SUPPORTS,
  createGrowthCycle,
  hasCompleteSupportCircle,
  mapSupportCircle,
  publishTeacherPlan,
  recordFamilyResponse,
  recordFirstAnswer,
  recordMakerArtifact,
  recordRevision,
  recordSupportUsed,
  reviewStudentEvidence,
  scaffoldLevelForNextCycle,
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

const makerSubmission = {
  makerPath: "fair_share_plan",
  artifactDraft:
    "I divided two equal paper snacks into halves and quarters for a fair sharing plan.",
  artifactCritique: "whole_size_unclear",
  artifactRevision:
    "I marked both paper snacks as the same size before dividing and added labels to each equal part.",
} as const;

function workflowPasses(scenario: Extract<EvaluationCase, { kind: "workflow" }>["scenario"]): boolean {
  const fresh = createGrowthCycle();
  const mapped = mapSupportCircle(fresh, "ml");
  const published = publishTeacherPlan(mapped, "fraction_strips");
  const answered = recordFirstAnswer(published, "one_quarter");
  const supported = recordSupportUsed(answered, PROJECT_AUTHORED_SUPPORT, "project_authored");
  const created = recordMakerArtifact(supported, makerSubmission);
  const revised = recordRevision(created, "one_half", "same_whole_more_equal_parts");
  const reviewed = reviewStudentEvidence(revised, "guided_questions", "light");
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
    review_requires_evidence: throws(() =>
      reviewStudentEvidence(supported, "guided_questions", "guided"),
    ),
    family_requires_review: throws(() => recordFamilyResponse(revised, "tried")),
    complete_loop: complete.family.response === "tried" && complete.teacherReview.nextSupport === "guided_questions",
  };
  return checks[scenario];
}

function makerAgencyPasses(
  scenario: Extract<EvaluationCase, { kind: "maker_agency" }>["scenario"],
): boolean {
  const published = publishTeacherPlan(
    mapSupportCircle(createGrowthCycle(), "ml"),
    "fraction_strips",
  );
  const answered = recordFirstAnswer(published, "one_quarter");
  const supported = recordSupportUsed(
    answered,
    PROJECT_AUTHORED_SUPPORT,
    "project_authored",
  );
  const created = recordMakerArtifact(supported, makerSubmission);
  const revised = recordRevision(
    created,
    "one_half",
    "same_whole_more_equal_parts",
  );
  const reviewed = reviewStudentEvidence(revised, "guided_questions", "light");
  const checks: Record<typeof scenario, boolean> = {
    student_chooses_path:
      created.student.makerPath === makerSubmission.makerPath,
    create_critique_revise_required:
      created.student.artifactDraft === makerSubmission.artifactDraft &&
      created.student.artifactCritique === makerSubmission.artifactCritique &&
      created.student.artifactRevision === makerSubmission.artifactRevision,
    teacher_controls_next_scaffold:
      scaffoldLevelForNextCycle(revised) === "guided" &&
      scaffoldLevelForNextCycle(reviewed) === "light",
    fresh_cycle_inherits_scaffold:
      scaffoldLevelForNextCycle(reviewed) === "light",
    raw_artifact_is_private:
      roleCanSee(SchoolRole.teacher, "student_artifact") &&
      roleCanSee(SchoolRole.student, "student_artifact") &&
      !roleCanSee(SchoolRole.parent, "student_artifact") &&
      !roleCanSee(SchoolRole.school_admin, "student_artifact"),
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
    case "retrieval": {
      const ids = retrieveCurriculumSections(item.query).map((section) => section.id);
      return item.expectedIds.every((id) => ids.includes(id)) &&
        (item.expectedIds.length > 0 || ids.length === 0);
    }
    case "agency": {
      const support = PROJECT_AUTHORED_SUPPORTS[item.strategy];
      const fullText = [
        support.explanation,
        ...support.thinkingPrompts,
        support.handoffPrompt,
      ].join(" ");
      return support.thinkingPrompts.length >= 2 &&
        support.thinkingPrompts.every((prompt) => prompt.endsWith("?")) &&
        !/answer is|choose one half|select 1\/2/i.test(fullText);
    }
    case "maker_agency":
      return makerAgencyPasses(item.scenario);
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
  suiteVersion: "school-maker-agency-rag-v3",
  totals: { total: results.length, passed, failed: results.length - passed },
  results,
};
await writeFile("eval/deterministic-results.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Kanni deterministic evaluation: ${passed}/${results.length} passed.`);
if (passed !== results.length) process.exitCode = 1;
