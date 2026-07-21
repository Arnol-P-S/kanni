import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  generateText: vi.fn(),
  modelFactory: vi.fn(() => ({ provider: "mock" })),
  createOpenRouter: vi.fn(),
}));

mocks.createOpenRouter.mockImplementation(() => mocks.modelFactory);

vi.mock("ai", () => ({
  generateText: mocks.generateText,
  NoObjectGeneratedError: {
    isInstance: (error: unknown) =>
      Boolean(error && typeof error === "object" && (error as { name?: string }).name === "AI_NoObjectGeneratedError"),
  },
  Output: { object: vi.fn(() => ({ type: "mock-output" })) },
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: mocks.createOpenRouter,
}));

const originalEnvironment = { ...process.env };

describe("grounded teacher-plan output gate", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.generateText.mockReset();
    mocks.modelFactory.mockClear();
    mocks.createOpenRouter.mockClear();
    process.env.GROWTH_AI_ENABLED = "true";
    process.env.GROWTH_AI_PROVIDER = "openrouter";
    process.env.GROWTH_AI_MODEL = "openai/gpt-5.6-luna";
    process.env.OPENROUTER_API_KEY = "test-key-not-a-real-provider-secret";
    process.env.GROWTH_AI_STUDENT_HELP_ENABLED = "true";
    process.env.GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED = "true";
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  async function fixture() {
    const { splitCurriculumIntoSections } = await import("@/lib/curriculum/rag");
    const { createTeacherStarterPlan } = await import("@/lib/studio/plan");
    const sections = splitCurriculumIntoSections(`
Claims and evidence
A claim needs relevant evidence. A strong explanation states the claim, points to exact evidence, and explains why the evidence supports it.

Testing and revision
Start with a prediction, test it with an example, and revise the first version when the evidence points to a stronger explanation.
`);
    const plan = createTeacherStarterPlan({
      goal: "Test a claim against curriculum evidence and revise the explanation when needed.",
      drivingQuestion: "How can evidence help us decide whether to keep or revise a claim?",
      familyLocale: "en",
      sections,
    });
    return { sections, plan };
  }

  async function generate(
    plan: Awaited<ReturnType<typeof fixture>>["plan"],
    sections: Awaited<ReturnType<typeof fixture>>["sections"],
  ) {
    mocks.generateText.mockResolvedValue({
      output: plan,
      usage: { inputTokens: 500, outputTokens: 700 },
      providerMetadata: { openrouter: { usage: { cost: 0.004 } } },
    });
    const { generateGroundedTeacherPlan } = await import("@/lib/ai/studio-ai");
    return generateGroundedTeacherPlan({
      title: "Evidence investigation",
      subject: "Science",
      gradeLabel: "Class 8",
      goal: "Test a claim against curriculum evidence and revise the explanation when needed.",
      drivingQuestion: "How can evidence help us decide whether to keep or revise a claim?",
      familyLocale: "en",
      sections,
    });
  }

  it("accepts a safe plan with only retrieved citations", async () => {
    const { sections, plan } = await fixture();
    const result = await generate(plan, sections);

    expect(result.status).toBe("succeeded");
    expect(result.plan).toEqual(plan);
    expect(result.costMicros).toBe(4_000);
    expect(mocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxOutputTokens: 3_200, maxRetries: 0 }),
    );
    expect(mocks.modelFactory).toHaveBeenCalledWith(
      "openai/gpt-5.6-luna",
      expect.objectContaining({
        extraBody: expect.objectContaining({
          store: false,
          provider: expect.objectContaining({
            only: ["openai"],
            data_collection: "deny",
            allow_fallbacks: false,
          }),
        }),
      }),
    );
  });

  it("discards a schema-shaped plan containing personal data", async () => {
    const { sections, plan } = await fixture();
    plan.overview = "Send the learner details to teacher@example.com before continuing.";

    const result = await generate(plan, sections);

    expect(result.status).toBe("rejected");
    expect(result.plan).toBeNull();
    expect(result.errorCode).toBe("output_safety_rejected");
  });

  it("discards a schema-shaped plan with an invented citation", async () => {
    const { sections, plan } = await fixture();
    plan.quickChecks[0].sourceSectionIds = ["SEC-999"];

    const result = await generate(plan, sections);

    expect(result.status).toBe("rejected");
    expect(result.plan).toBeNull();
    expect(result.errorCode).toBe("citation_rejected");
  });

  it("records a truncated structured response as a rejected draft", async () => {
    const { sections } = await fixture();
    mocks.generateText.mockRejectedValue({
      name: "AI_NoObjectGeneratedError",
      finishReason: "length",
      usage: { inputTokens: 600, outputTokens: 3_200 },
    });
    const { generateGroundedTeacherPlan } = await import("@/lib/ai/studio-ai");
    const result = await generateGroundedTeacherPlan({
      title: "Evidence investigation",
      subject: "Science",
      gradeLabel: "Class 8",
      goal: "Test a claim against curriculum evidence and revise the explanation when needed.",
      drivingQuestion: "How can evidence help us decide whether to keep or revise a claim?",
      familyLocale: "en",
      sections,
    });

    expect(result.status).toBe("rejected");
    expect(result.errorCode).toBe("structured_output_truncated");
    expect(result.inputTokens).toBe(600);
    expect(result.outputTokens).toBe(3_200);
  });

  it("returns bounded creative steps instead of a completed student answer", async () => {
    const { sections } = await fixture();
    const referenceId = sections[0].referenceId;
    mocks.generateText.mockResolvedValue({
      output: {
        schemaVersion: "student-thinking-coach-v1",
        opening: "Your first version gives you a useful claim to test.",
        creativeSteps: [
          {
            title: "Mark the claim",
            question: "Which sentence is the claim you want your evidence to support?",
            tryThis: "Underline that sentence and place one source detail beside it.",
            sourceSectionIds: [referenceId],
          },
          {
            title: "Try a counterexample",
            question: "What example would make your first claim less convincing?",
            tryThis: "Create one small test case and compare its result with your prediction.",
            sourceSectionIds: [referenceId],
          },
          {
            title: "Choose one revision",
            question: "What is the smallest change that makes the evidence and claim fit?",
            tryThis: "Revise one sentence, then write why the evidence supports the change.",
            sourceSectionIds: [referenceId],
          },
        ],
        selfCheck: "Use a new example and repeat the test without reopening AI help.",
        sourceSectionIds: [referenceId],
      },
      usage: { inputTokens: 240, outputTokens: 310 },
      providerMetadata: { openrouter: { usage: { cost: 0.0015 } } },
    });
    const { generateGroundedStudentHelp } = await import("@/lib/ai/studio-ai");
    const result = await generateGroundedStudentHelp({
      subject: "Science",
      gradeLabel: "Class 8",
      goal: "Test a claim against curriculum evidence and revise the explanation when needed.",
      drivingQuestion: "How can evidence help us decide whether to keep or revise a claim?",
      firstDraft:
        "I made a claim from my prediction, but I have not yet shown why the evidence supports it or tested a different example.",
      sections,
    });

    expect(result.status).toBe("succeeded");
    expect(result.help?.creativeSteps).toHaveLength(3);
    expect(result.costMicros).toBe(1_500);
    expect(mocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxOutputTokens: 900, maxRetries: 0 }),
    );
  });
});
