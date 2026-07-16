"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  generateStudentSupportDraft,
  generateTeacherPlanDraft,
  getGrowthAiCapability,
} from "@/lib/ai/growth-ai";
import {
  DemoPersonaIdSchema,
  demoPersonas,
  type DemoPersonaId,
} from "@/lib/demo-fixtures";
import {
  endDemoSession,
  readDemoCycle,
  requireDemoActor,
  requireGrowthCapability,
  startDemoSession,
  writeDemoCycle,
} from "@/lib/demo-server";
import {
  ExplanationChoiceSchema,
  FamilyLanguageSchema,
  FamilyResponseSchema,
  FractionAnswerSchema,
  PROJECT_AUTHORED_PLAN,
  SupportStrategySchema,
  createGrowthCycle,
  flagStudentDisagreement,
  mapSupportCircle,
  publishTeacherPlan,
  recordFamilyResponse,
  recordFirstAnswer,
  recordRevision,
  recordSupportUsed,
  reviewStudentEvidence,
  setTeacherPlanDraft,
} from "@/lib/growth-cycle";

const LoginSchema = z.object({
  personaId: DemoPersonaIdSchema,
  adultConfirmed: z.literal("on"),
});

export async function loginDemo(formData: FormData): Promise<never> {
  const parsed = LoginSchema.safeParse({
    personaId: formData.get("personaId"),
    adultConfirmed: formData.get("adultConfirmed"),
  });
  if (!parsed.success) redirect("/login?notice=confirmation-required");
  await startDemoSession(parsed.data.personaId);
  redirect(demoPersonas[parsed.data.personaId].homePath);
}

export async function switchDemoAccount(): Promise<never> {
  await endDemoSession();
  redirect("/login?notice=account-switched");
}

export async function resetDemoWorkspace(): Promise<never> {
  const actor = await requireDemoActor("tenant_admin");
  await writeDemoCycle(createGrowthCycle(new Date()));
  redirect(demoPersonas[actor.personaId as DemoPersonaId].homePath);
}

export async function mapSupportCircleAction(
  formData: FormData,
): Promise<never> {
  const actor = await requireDemoActor("tenant_admin");
  const language = FamilyLanguageSchema.safeParse(formData.get("familyLanguage"));
  if (!language.success) redirect("/portal/admin?notice=invalid-language");
  const cycle = await readDemoCycle();
  await writeDemoCycle(mapSupportCircle(cycle, language.data));
  redirect(demoPersonas[actor.personaId as DemoPersonaId].homePath);
}

export async function draftTeacherPlanWithAi(): Promise<never> {
  const { cycle } = await requireGrowthCapability("plan_instruction");
  if (cycle.plan.aiStatus !== "not_requested") {
    redirect("/portal/teacher?notice=ai-already-requested");
  }
  const capability = getGrowthAiCapability();
  const result = await generateTeacherPlanDraft();
  const aiStatus = result.origin === "gpt_5_6" ? "ready" : "unavailable";
  await writeDemoCycle(
    setTeacherPlanDraft(
      cycle,
      result.draft,
      result.origin,
      capability.available ? aiStatus : "unavailable",
    ),
  );
  redirect("/portal/teacher#plan");
}

export async function restoreProjectAuthoredPlan(): Promise<never> {
  const { cycle } = await requireGrowthCapability("plan_instruction");
  await writeDemoCycle(
    setTeacherPlanDraft(
      cycle,
      PROJECT_AUTHORED_PLAN,
      "project_authored",
      "not_requested",
    ),
  );
  redirect("/portal/teacher#plan");
}

export async function publishTeacherPlanAction(
  formData: FormData,
): Promise<never> {
  const { cycle } = await requireGrowthCapability("plan_instruction");
  const strategy = SupportStrategySchema.safeParse(formData.get("strategy"));
  if (!strategy.success) redirect("/portal/teacher?notice=invalid-strategy");
  await writeDemoCycle(publishTeacherPlan(cycle, strategy.data));
  redirect("/portal/teacher?notice=plan-published");
}

export async function recordFirstAnswerAction(
  formData: FormData,
): Promise<never> {
  const { cycle } = await requireGrowthCapability("submit_evidence");
  const answer = FractionAnswerSchema.safeParse(formData.get("answer"));
  if (!answer.success) redirect("/portal/student?notice=choose-answer");
  await writeDemoCycle(recordFirstAnswer(cycle, answer.data));
  redirect("/portal/student#support");
}

export async function useStudentSupportAction(): Promise<never> {
  const { actor, cycle } = await requireGrowthCapability("submit_evidence");
  if (!actor.adultConfirmed) redirect("/portal/student?notice=adult-required");
  if (cycle.student.supportUsed) redirect("/portal/student#support");
  const result = await generateStudentSupportDraft(cycle.plan.selectedSupport);
  await writeDemoCycle(
    recordSupportUsed(cycle, result.support, result.origin),
  );
  redirect("/portal/student#support");
}

export async function recordRevisionAction(
  formData: FormData,
): Promise<never> {
  const { cycle } = await requireGrowthCapability("submit_evidence");
  const parsed = z
    .object({
      answer: FractionAnswerSchema,
      explanation: ExplanationChoiceSchema,
    })
    .safeParse({
      answer: formData.get("answer"),
      explanation: formData.get("explanation"),
    });
  if (!parsed.success) redirect("/portal/student?notice=complete-evidence");
  await writeDemoCycle(
    recordRevision(cycle, parsed.data.answer, parsed.data.explanation),
  );
  redirect("/portal/student?notice=evidence-sent");
}

export async function flagStudentDisagreementAction(): Promise<never> {
  const { cycle } = await requireGrowthCapability("submit_evidence");
  await writeDemoCycle(flagStudentDisagreement(cycle));
  redirect("/portal/student?notice=disagreement-recorded");
}

export async function reviewStudentEvidenceAction(
  formData: FormData,
): Promise<never> {
  const { cycle } = await requireGrowthCapability("review_evidence");
  const strategy = SupportStrategySchema.safeParse(formData.get("nextSupport"));
  if (!strategy.success) redirect("/portal/teacher?notice=invalid-strategy");
  await writeDemoCycle(reviewStudentEvidence(cycle, strategy.data));
  redirect("/portal/teacher?notice=family-brief-approved");
}

export async function recordFamilyResponseAction(
  formData: FormData,
): Promise<never> {
  const { cycle } = await requireGrowthCapability("respond_to_family_brief");
  const response = FamilyResponseSchema.exclude(["not_sent"]).safeParse(
    formData.get("response"),
  );
  if (!response.success) redirect("/portal/parent?notice=choose-response");
  await writeDemoCycle(recordFamilyResponse(cycle, response.data));
  redirect("/portal/parent?notice=response-sent");
}
