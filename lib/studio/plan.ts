import type { CurriculumSectionRecord } from "@/lib/curriculum/rag";
import type { TeacherPlan } from "@/lib/studio/contracts";

type StarterPlanInput = {
  goal: string;
  drivingQuestion: string;
  familyLocale: "en" | "ml";
  sections: readonly CurriculumSectionRecord[];
};

function references(sections: readonly CurriculumSectionRecord[]): string[] {
  const ids = sections.slice(0, 4).map((section) => section.referenceId);
  if (ids.length === 0) throw new Error("curriculum-sections-required");
  return ids;
}

export function createTeacherStarterPlan(input: StarterPlanInput): TeacherPlan {
  const sourceSectionIds = references(input.sections);
  const primarySource = [sourceSectionIds[0]];
  const familyActivity =
    input.familyLocale === "ml"
      ? `വീട്ടിൽ ${input.goal} എന്ന ലക്ഷ്യവുമായി ബന്ധപ്പെട്ട ഒരു ഉദാഹരണം കണ്ടെത്തുക. കുട്ടിയോട് ആദ്യം ഒരു പ്രവചനം പറയാനും, തെളിവ് കാണിക്കാനും, ചിന്ത മാറിയെങ്കിൽ കാരണം വിശദീകരിക്കാനും ആവശ്യപ്പെടുക.`
      : `Find one home example connected to this goal: ${input.goal} Ask the learner to predict first, show evidence, and explain what changed in their thinking.`;

  return {
    schemaVersion: "teacher-plan-v1",
    overview: `A teacher-owned starting plan for this goal: ${input.goal}`,
    successCriteria: [
      `The learner can respond to this question with evidence: ${input.drivingQuestion}`,
      "The learner can test an early idea and name what the evidence shows.",
      "The learner can revise the work and explain why the revision is stronger.",
    ],
    learningSequence: [
      {
        phase: "notice",
        title: "Notice and predict",
        teacherMove: "Invite a private prediction before showing a method or worked answer.",
        learnerMove: "Write an early idea and name what makes it seem reasonable.",
        minutes: 5,
        sourceSectionIds: primarySource,
      },
      {
        phase: "explore",
        title: "Inspect the source",
        teacherMove: "Point to a relevant curriculum section and ask what evidence matters.",
        learnerMove: "Find one useful detail and connect it to the prediction.",
        minutes: 10,
        sourceSectionIds: sourceSectionIds.slice(0, 2),
      },
      {
        phase: "make",
        title: "Make and test",
        teacherMove: "Offer choices for how the learner can model, test, or explain the idea.",
        learnerMove: "Create a first version, test it against the source, and record what happened.",
        minutes: 18,
        sourceSectionIds: sourceSectionIds.slice(0, 3),
      },
      {
        phase: "explain",
        title: "Critique and revise",
        teacherMove: "Ask for one weakness and one evidence-based improvement.",
        learnerMove: "Revise the work and explain the reason for the change.",
        minutes: 10,
        sourceSectionIds: sourceSectionIds.slice(0, 3),
      },
      {
        phase: "reflect",
        title: "Reflect on the process",
        teacherMove: "Ask which support helped and what the learner can now try alone.",
        learnerMove: "Name a useful strategy and choose a next question.",
        minutes: 5,
        sourceSectionIds: primarySource,
      },
    ],
    differentiation: [
      {
        learnerNeed: "concrete_start",
        teacherMove: "Begin with one visible example from the source before asking for a general rule.",
        learnerChoice: "Draw, arrange objects, or describe a real example.",
        sourceSectionIds: primarySource,
      },
      {
        learnerNeed: "language_bridge",
        teacherMove: "Keep the same idea, shorten the instruction, and permit a Malayalam explanation first.",
        learnerChoice: "Explain with labels, short sentences, or both languages.",
        sourceSectionIds: primarySource,
      },
      {
        learnerNeed: "ready_for_extension",
        teacherMove: "Ask the learner to find a case where the first method does not work well.",
        learnerChoice: "Create a counterexample or compare two possible methods.",
        sourceSectionIds: sourceSectionIds.slice(0, 2),
      },
    ],
    misconceptions: [
      {
        ideaToCheck: "The learner may apply a familiar rule without checking whether it fits this case.",
        probe: "What evidence would make you keep or change that rule here?",
        teacherResponse: "Return to one source example and ask the learner to compare it with the prediction.",
        sourceSectionIds: primarySource,
      },
      {
        ideaToCheck: "The learner may state a conclusion without showing the link between evidence and claim.",
        probe: "Which exact detail supports your conclusion, and how does it support it?",
        teacherResponse: "Ask for one claim, one piece of evidence, and one connecting sentence.",
        sourceSectionIds: sourceSectionIds.slice(0, 2),
      },
    ],
    quickChecks: [
      {
        prompt: "Make a prediction and give one reason before beginning the activity.",
        evidenceToNotice: "The reason refers to an idea the learner can later test.",
        sourceSectionIds: primarySource,
      },
      {
        prompt: "Show one revision and explain which evidence caused the change.",
        evidenceToNotice: "The learner connects the change to evidence rather than only changing wording.",
        sourceSectionIds: sourceSectionIds.slice(0, 2),
      },
    ],
    interestHooks: [
      {
        title: "A problem you care about",
        prompt: "Apply the goal to a small problem from sport, games, home, nature, or your neighbourhood.",
      },
      {
        title: "Teach it your way",
        prompt: "Choose a format you enjoy and make the idea understandable to another learner.",
      },
      {
        title: "Find the weak claim",
        prompt: "Create or find a claim that sounds right, then test whether the evidence supports it.",
      },
    ],
    makerChoices: [
      {
        id: "make_model",
        title: "Build a model",
        prompt: "Create a model, diagram, table, or set of examples that answers the driving question.",
        constraints: ["Use evidence from the curriculum source.", "Include one test of the first idea."],
        evidenceToCapture: "Describe the model and the result of the test.",
      },
      {
        id: "make_explanation",
        title: "Create an explanation",
        prompt: "Create a short explanation for another learner, then test whether it answers a likely question.",
        constraints: ["Use your own words.", "Connect one claim to one source detail."],
        evidenceToCapture: "Record the first explanation, the question used to test it, and the revision.",
      },
      {
        id: "make_challenge",
        title: "Design a challenge",
        prompt: "Design a small challenge that reveals whether someone understands the goal, then solve it yourself.",
        constraints: ["Keep the challenge within the source.", "Explain why the evidence is convincing."],
        evidenceToCapture: "Record the challenge, your response, and one improvement after testing it.",
      },
    ],
    socraticPrompts: [
      "What do you predict before you inspect the source?",
      "Which source detail supports or challenges your prediction?",
      "What could you make or test instead of asking for the answer?",
      "What is one weakness in your first version?",
      "Why is the revised version stronger?",
    ],
    reflectionPrompts: [
      "Which part of the work came from your own decision?",
      "Which support can you use less next time, and what can you now do alone?",
      "What new question do you want to investigate?",
    ],
    familyActivity,
    familyLocale: input.familyLocale,
    sourceSectionIds,
  };
}
