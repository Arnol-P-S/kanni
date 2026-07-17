import { Locale, SchoolRole } from "@prisma/client";

import type {
  CycleInformation,
  SchoolCapability,
} from "@/lib/permissions";
import type { GrowthAiEnvironment } from "@/lib/ai/capability-policy";
import type { FractionsSectionId } from "@/lib/curriculum/fractions-foundation";
import type { SupportStrategy } from "@/lib/growth-cycle";

type AuthorizationCase = {
  kind: "authorization";
  role: SchoolRole;
  capability: SchoolCapability;
  expected: boolean;
};

type WorkflowCase = {
  kind: "workflow";
  scenario:
    | "starts_in_draft"
    | "mapping_completes"
    | "publish_requires_mapping"
    | "publish_after_mapping"
    | "answer_requires_publish"
    | "first_answer_is_idempotent"
    | "support_requires_answer"
    | "revision_requires_support"
    | "revision_after_support"
    | "review_requires_evidence"
    | "family_requires_review"
    | "complete_loop";
};

type LanguageCase = {
  kind: "language";
  locale: Locale;
  expected: string;
};

type PrivacyCase = {
  kind: "privacy";
  role: SchoolRole;
  information: CycleInformation;
  expected: boolean;
};

type AiPolicyCase = {
  kind: "ai_policy";
  environment: GrowthAiEnvironment;
  expectedReason:
    | "disabled_by_flag"
    | "missing_credentials"
    | "model_not_allowed"
    | "release_controls_missing";
};

type RetrievalCase = {
  kind: "retrieval";
  query: string;
  expectedIds: FractionsSectionId[];
};

type AgencyCase = {
  kind: "agency";
  strategy: SupportStrategy;
};

type MakerAgencyCase = {
  kind: "maker_agency";
  scenario:
    | "student_chooses_path"
    | "create_critique_revise_required"
    | "teacher_controls_next_scaffold"
    | "fresh_cycle_inherits_scaffold"
    | "raw_artifact_is_private";
};

export type EvaluationCase = (
  | AuthorizationCase
  | WorkflowCase
  | LanguageCase
  | PrivacyCase
  | AiPolicyCase
  | RetrievalCase
  | AgencyCase
  | MakerAgencyCase
) & {
  id: string;
  category: "authorization" | "workflow" | "language" | "privacy" | "ai_policy" | "retrieval" | "agency" | "maker_agency";
};

export const evalCases: EvaluationCase[] = [
  { id: "auth-01", category: "authorization", kind: "authorization", role: SchoolRole.school_admin, capability: "manage_school", expected: true },
  { id: "auth-02", category: "authorization", kind: "authorization", role: SchoolRole.school_admin, capability: "review_evidence", expected: false },
  { id: "auth-03", category: "authorization", kind: "authorization", role: SchoolRole.teacher, capability: "plan_instruction", expected: true },
  { id: "auth-04", category: "authorization", kind: "authorization", role: SchoolRole.teacher, capability: "submit_evidence", expected: false },
  { id: "auth-05", category: "authorization", kind: "authorization", role: SchoolRole.student, capability: "submit_evidence", expected: true },
  { id: "auth-06", category: "authorization", kind: "authorization", role: SchoolRole.student, capability: "plan_instruction", expected: false },
  { id: "auth-07", category: "authorization", kind: "authorization", role: SchoolRole.parent, capability: "respond_to_family_activity", expected: true },
  { id: "auth-08", category: "authorization", kind: "authorization", role: SchoolRole.parent, capability: "review_evidence", expected: false },
  { id: "flow-01", category: "workflow", kind: "workflow", scenario: "starts_in_draft" },
  { id: "flow-02", category: "workflow", kind: "workflow", scenario: "mapping_completes" },
  { id: "flow-03", category: "workflow", kind: "workflow", scenario: "publish_requires_mapping" },
  { id: "flow-04", category: "workflow", kind: "workflow", scenario: "publish_after_mapping" },
  { id: "flow-05", category: "workflow", kind: "workflow", scenario: "answer_requires_publish" },
  { id: "flow-06", category: "workflow", kind: "workflow", scenario: "first_answer_is_idempotent" },
  { id: "flow-07", category: "workflow", kind: "workflow", scenario: "support_requires_answer" },
  { id: "flow-08", category: "workflow", kind: "workflow", scenario: "revision_requires_support" },
  { id: "flow-09", category: "workflow", kind: "workflow", scenario: "revision_after_support" },
  { id: "flow-10", category: "workflow", kind: "workflow", scenario: "review_requires_evidence" },
  { id: "flow-11", category: "workflow", kind: "workflow", scenario: "family_requires_review" },
  { id: "flow-12", category: "workflow", kind: "workflow", scenario: "complete_loop" },
  { id: "lang-01", category: "language", kind: "language", locale: Locale.en, expected: "Learning goal" },
  { id: "lang-02", category: "language", kind: "language", locale: Locale.ml, expected: "പഠനലക്ഷ്യം" },
  { id: "lang-03", category: "language", kind: "language", locale: Locale.en, expected: "Parent" },
  { id: "lang-04", category: "language", kind: "language", locale: Locale.ml, expected: "രക്ഷിതാവ്" },
  { id: "privacy-01", category: "privacy", kind: "privacy", role: SchoolRole.parent, information: "student_evidence", expected: false },
  { id: "privacy-02", category: "privacy", kind: "privacy", role: SchoolRole.parent, information: "family_activity", expected: true },
  { id: "privacy-03", category: "privacy", kind: "privacy", role: SchoolRole.school_admin, information: "student_evidence", expected: false },
  { id: "privacy-04", category: "privacy", kind: "privacy", role: SchoolRole.teacher, information: "student_evidence", expected: true },
  { id: "ai-01", category: "ai_policy", kind: "ai_policy", environment: {}, expectedReason: "disabled_by_flag" },
  { id: "ai-02", category: "ai_policy", kind: "ai_policy", environment: { GROWTH_AI_ENABLED: "true", GROWTH_AI_PROVIDER: "openrouter" }, expectedReason: "missing_credentials" },
  { id: "ai-03", category: "ai_policy", kind: "ai_policy", environment: { GROWTH_AI_ENABLED: "true", GROWTH_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "redacted", GROWTH_AI_MODEL: "unapproved/model" }, expectedReason: "model_not_allowed" },
  { id: "ai-04", category: "ai_policy", kind: "ai_policy", environment: { NODE_ENV: "production", GROWTH_AI_ENABLED: "true", GROWTH_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "redacted", GROWTH_AI_MODEL: "openai/gpt-5.6-sol" }, expectedReason: "release_controls_missing" },
  { id: "rag-01", category: "retrieval", kind: "retrieval", query: "compare half and quarter using equal wholes", expectedIds: ["fractions-goal"] },
  { id: "rag-02", category: "retrieval", kind: "retrieval", query: "guided questions with fraction strips and the space one part takes", expectedIds: ["fractions-visual"] },
  { id: "rag-03", category: "retrieval", kind: "retrieval", query: "anticipate denominator misconceptions", expectedIds: ["fractions-misconceptions"] },
  { id: "rag-04", category: "retrieval", kind: "retrieval", query: "rank this learner and recommend a career", expectedIds: [] },
  { id: "agency-01", category: "agency", kind: "agency", strategy: "fraction_strips" },
  { id: "agency-02", category: "agency", kind: "agency", strategy: "guided_questions" },
  { id: "agency-03", category: "agency", kind: "agency", strategy: "explain_to_someone" },
  { id: "maker-01", category: "maker_agency", kind: "maker_agency", scenario: "student_chooses_path" },
  { id: "maker-02", category: "maker_agency", kind: "maker_agency", scenario: "create_critique_revise_required" },
  { id: "maker-03", category: "maker_agency", kind: "maker_agency", scenario: "teacher_controls_next_scaffold" },
  { id: "maker-04", category: "maker_agency", kind: "maker_agency", scenario: "fresh_cycle_inherits_scaffold" },
  { id: "maker-05", category: "maker_agency", kind: "maker_agency", scenario: "raw_artifact_is_private" },
];
