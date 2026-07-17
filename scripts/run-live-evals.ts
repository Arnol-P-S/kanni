import "dotenv/config";

import {
  generateStudentSupportDraft,
  generateTeacherPlanDraft,
  getGrowthAiCapability,
} from "../lib/ai/growth-ai";

process.env.GROWTH_AI_DIAGNOSTICS = "true";

const capability = getGrowthAiCapability();
const studentOnly = process.argv.includes("--student-only");
if (!capability.available) {
  console.error(`Live evaluation is unavailable: ${capability.reason}.`);
  process.exitCode = 1;
} else if (studentOnly) {
  const support = await generateStudentSupportDraft(
    "guided_questions",
    "ml",
  );
  const passed = support.origin === "gpt_5_6";
  console.log(
    `Kanni live student evaluation: ${passed ? "1/1" : "fallback used"}. Model ${capability.model}. Student: ${support.fallbackReason ?? "grounded"}.`,
  );
  if (!passed) process.exitCode = 1;
} else {
  const [plan, support] = await Promise.all([
    generateTeacherPlanDraft("ml"),
    generateStudentSupportDraft("guided_questions", "ml"),
  ]);
  const passed =
    plan.origin === "gpt_5_6" &&
    support.origin === "gpt_5_6";
  console.log(
    `Kanni live AI evaluation: ${passed ? "2/2" : "fallback used"}. Model ${capability.model}. Plan: ${plan.fallbackReason ?? "grounded"}. Student: ${support.fallbackReason ?? "grounded"}.`,
  );
  if (!passed) process.exitCode = 1;
}
