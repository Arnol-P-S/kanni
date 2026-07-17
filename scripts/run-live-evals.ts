import {
  generateStudentSupportDraft,
  generateTeacherPlanDraft,
  getGrowthAiCapability,
} from "../lib/ai/growth-ai";

const capability = getGrowthAiCapability();
if (!capability.available) {
  console.error(`Live evaluation is unavailable: ${capability.reason}.`);
  process.exitCode = 1;
} else {
  const plan = await generateTeacherPlanDraft();
  const supports = await Promise.all([
    generateStudentSupportDraft("fraction_strips"),
    generateStudentSupportDraft("guided_questions"),
    generateStudentSupportDraft("explain_to_someone"),
  ]);
  const passed =
    plan.origin === "gpt_5_6" &&
    supports.every((result) => result.origin === "gpt_5_6");
  console.log(
    `Kanni live AI evaluation: ${passed ? "4/4" : "fallback used"}. Model ${capability.model}.`,
  );
  if (!passed) process.exitCode = 1;
}
