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
  Output: { object: vi.fn(() => ({ type: "mock-output" })) },
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: mocks.createOpenRouter,
}));

const originalEnvironment = { ...process.env };

describe("student-facing GrowthCycle AI output gate", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.generateText.mockReset();
    mocks.modelFactory.mockClear();
    mocks.createOpenRouter.mockClear();
    process.env.GROWTH_AI_ENABLED = "true";
    process.env.GROWTH_AI_PROVIDER = "openrouter";
    process.env.GROWTH_AI_MODEL = "openai/gpt-5.6-sol";
    process.env.OPENROUTER_API_KEY = "test-key-not-a-real-secret";
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it("hides a schema-shaped response that fails the deterministic content gate", async () => {
    mocks.generateText.mockResolvedValue({
      output: {
        explanation:
          "One half and one quarter are equal. Contact me at https://example.test for the answer.",
        thinkingPrompts: [
          "Are the wholes equal?",
          "Which part takes more space?",
        ],
        handoffPrompt: "Choose again.",
        sourceSectionIds: ["fractions-visual"],
      },
    });
    const { generateStudentSupportDraft } = await import(
      "@/lib/ai/growth-ai"
    );
    const result = await generateStudentSupportDraft("fraction_strips");
    expect(result.origin).toBe("project_authored");
    expect(result.support.explanation).not.toContain("example.test");
  });

  it("accepts a bounded response that passes the strategy-specific gate", async () => {
    mocks.generateText.mockResolvedValue({
      output: {
        explanation:
          "Use one half and one quarter from equal wholes as your evidence.",
        thinkingPrompts: [
          "Are the wholes equal?",
          "Is one half or one quarter made from more equal parts?",
          "Which part takes more space, and what evidence supports your idea?",
        ],
        handoffPrompt: "Use your evidence to decide, then explain your choice.",
        sourceSectionIds: ["fractions-goal", "fractions-visual"],
      },
    });
    const { generateStudentSupportDraft } = await import(
      "@/lib/ai/growth-ai"
    );
    const result = await generateStudentSupportDraft("guided_questions");
    expect(result.origin).toBe("gpt_5_6");
    expect(mocks.modelFactory).toHaveBeenCalledWith(
      "openai/gpt-5.6-sol",
      expect.objectContaining({
        extraBody: expect.objectContaining({
          max_tokens: undefined,
          max_completion_tokens: 600,
          provider: expect.objectContaining({
            only: ["azure"],
            require_parameters: true,
          }),
        }),
      }),
    );
    expect(mocks.generateText.mock.calls[0]?.[0]).not.toHaveProperty(
      "temperature",
    );
    expect(mocks.generateText.mock.calls[0]?.[0]?.prompt).toContain(
      "one of two equal parts with one of four equal parts",
    );
  });

  it("hides a scaffold that gives the student the final choice", async () => {
    mocks.generateText.mockResolvedValue({
      output: {
        explanation: "Use equal wholes to compare one half and one quarter.",
        thinkingPrompts: [
          "Are the wholes equal?",
          "Which one has two equal parts?",
        ],
        handoffPrompt: "Choose one half because that is the answer.",
        sourceSectionIds: ["fractions-goal", "fractions-visual"],
      },
    });
    const { generateStudentSupportDraft } = await import(
      "@/lib/ai/growth-ai"
    );

    const result = await generateStudentSupportDraft("guided_questions");

    expect(result.origin).toBe("project_authored");
    expect(result.support.handoffPrompt).not.toMatch(/answer is/i);
  });

  it("accepts Malayalam two-part and four-part evidence without requiring English fraction names", async () => {
    mocks.generateText.mockResolvedValue({
      output: {
        explanation:
          "ഒരേ വലുപ്പമുള്ള മുഴുവനുകളെ തെളിവായി ഉപയോഗിക്കുക.",
        thinkingPrompts: [
          "ഒരു മുഴുവനെ രണ്ട് തുല്യ ഭാഗങ്ങളാക്കിയാൽ ഒരു ഭാഗം എത്ര സ്ഥലം എടുക്കുന്നു?",
          "അതേ മുഴുവനെ നാല് തുല്യ ഭാഗങ്ങളാക്കിയാൽ ഒരു ഭാഗത്തിന് എന്ത് മാറ്റമാണ് കാണുന്നത്?",
        ],
        handoffPrompt:
          "നിങ്ങളുടെ തെളിവ് ഉപയോഗിച്ച് തീരുമാനിച്ച് കാരണം വിശദീകരിക്കുക.",
        sourceSectionIds: ["fractions-goal", "fractions-visual"],
      },
    });
    const { generateStudentSupportDraft } = await import(
      "@/lib/ai/growth-ai"
    );

    const result = await generateStudentSupportDraft(
      "guided_questions",
      "ml",
    );

    expect(result.origin).toBe("gpt_5_6");
  });

  it("hides a teacher draft whose citations or agency move are not grounded", async () => {
    mocks.generateText.mockResolvedValue({
      output: {
        successCriteria: ["Compare fractions.", "Explain a comparison."],
        learningSequence: ["Show a model.", "Give the answer.", "Repeat."],
        misconceptionIds: ["denominator_size"],
        quickCheck: "Which is larger?",
        familyDraft: "Try a short activity.",
        agencyMove: "Tell the learner which answer to choose.",
        sourceSectionIds: ["not-retrieved"],
      },
    });
    const { generateTeacherPlanDraft } = await import("@/lib/ai/growth-ai");

    const result = await generateTeacherPlanDraft();

    expect(result.origin).toBe("project_authored");
    expect(result.draft.agencyMove).toMatch(/prediction/i);
  });
});
