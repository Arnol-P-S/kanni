import type {
  StudentThinkingCoach,
  TeacherPlan,
} from "@/lib/studio/contracts";

export const RECORDING_FLOW_KEY = "build-week-rainwater-resilience-v1";

export const RECORDING_REVIEWED_FIELD_PATHS = [
  "plan.overview",
  "plan.successCriteria[rainfall-capacity]",
  "plan.learningSequence[notice].teacherMove",
  "plan.learningSequence[prototype].teacherMove",
  "plan.socraticPrompts[overflow]",
  "plan.reflectionPrompts[uncertainty]",
  "studentHelp.selfCheck",
] as const;

function replaceOneByPrefix(
  values: readonly string[],
  prefix: string,
  replacement: string,
  field: string,
): string[] {
  let replacements = 0;
  const reviewed = values.map((value) => {
    if (!value.startsWith(prefix)) return value;
    replacements += 1;
    return replacement;
  });
  if (replacements !== 1) {
    throw new Error(`Recording review expected one ${field} field, found ${replacements}.`);
  }
  return reviewed;
}

export function applyRainwaterRecordingReview(
  plan: TeacherPlan,
  help: StudentThinkingCoach,
): { plan: TeacherPlan; help: StudentThinkingCoach } {
  if (!plan.overview.toLocaleLowerCase("en-IN").includes("rainwater")) {
    throw new Error("Recording review stopped because the teacher plan is not the rainwater plan.");
  }

  let noticeCorrections = 0;
  let prototypeCorrections = 0;
  const learningSequence = plan.learningSequence.map((step) => {
    if (step.title === "What would make an estimate trustworthy?") {
      noticeCorrections += 1;
      return {
        ...step,
        teacherMove:
          "Show the driving question and an evidence table for each number, unit, source, and whether it is measured or assumed. Provide safe supplied roof and rainfall figures. Ask learners which value they would verify first and why.",
      };
    }
    if (step.title === "Prototype a safe collection plan") {
      prototypeCorrections += 1;
      return {
        ...step,
        teacherMove:
          "Offer a labelled model, calculation board, or paper layout. Require covered storage, a first-flush path, an overflow route away from buildings and walking areas, and visible capacity. Remind learners that the design is for discussion, not permission to install equipment.",
      };
    }
    return step;
  });
  if (noticeCorrections !== 1 || prototypeCorrections !== 1) {
    throw new Error("Recording review could not identify both affected learning-sequence fields.");
  }

  return {
    plan: {
      ...plan,
      overview:
        "Learners investigate how much rainwater a school roof could provide for a garden. They use safe supplied measurements, calculate rainfall by roof area, apply a visible efficiency assumption, compare storage across two rainfall scenarios, test safety features, critique the weakest claim, and revise the design.",
      successCriteria: replaceOneByPrefix(
        plan.successCriteria,
        "I can compare expected collection with storage capacity",
        "I can compare expected collection with storage capacity across low- and high-rainfall scenarios under the same conditions.",
        "rainfall-capacity success criterion",
      ),
      learningSequence,
      socraticPrompts: replaceOneByPrefix(
        plan.socraticPrompts,
        "What would make your overflow claim trustworthy?",
        "What evidence would make your overflow route trustworthy?",
        "overflow Socratic prompt",
      ),
      reflectionPrompts: replaceOneByPrefix(
        plan.reflectionPrompts,
        "What could the water support, and what remains uncertain?",
        "What could the water support, and what remains uncertain?",
        "uncertainty reflection prompt",
      ),
    },
    help: {
      ...help,
      selfCheck:
        "Before sharing, check the units, efficiency multiplier, measured values, assumptions, tank capacity, first flush, and overflow route. Then repeat one new rainfall test without AI.",
    },
  };
}

export function recordingStudioReplacementScope(
  schoolId: string,
  events: ReadonlyArray<{ entityId: string }>,
) {
  return {
    schoolId,
    id: { in: [...new Set(events.map(({ entityId }) => entityId))] },
  };
}

export const rainwaterRecordingFlow = {
  pack: {
    title: "School-authored rainwater design notes",
    subject: "Science",
    gradeLabel: "Class 8" as const,
    version: "2026.1-recording",
    sourceText: `Rainfall, area, and volume
One millimetre of rain spread across one square metre is one litre of water. A first estimate of water reaching a roof is rainfall in millimetres multiplied by roof area in square metres. Keep the units visible so the result can be checked.

Collection efficiency
Not every litre that reaches a roof enters storage. Wind, splash, the first flush, gutter leaks, and overflow can reduce the collected amount. A design may state a collection-efficiency assumption between zero and one, then multiply the roof estimate by that factor. The assumption must be visible and open to revision.

Measurement and trustworthy evidence
Roof area can be estimated from safe, supplied length and width measurements. No learner should climb onto a roof. Record where each number came from, repeat a measurement when possible, and distinguish a measured value from an assumption. A strong claim shows the calculation and explains why the evidence is relevant.

Storage, overflow, and safe design
A storage proposal should compare expected collection with available capacity. Covered containers reduce contamination and mosquito access. A first-flush path keeps the earliest roof runoff out of storage, and an overflow route should move excess water away from buildings and walking areas. The design is a model for discussion, not permission to install equipment.

Fair tests, critique, and revision
Compare designs under the same rainfall scenario. Change one assumption at a time so its effect can be seen. Test a low-rainfall and a high-rainfall month, identify the weakest claim in the first design, and revise it when the calculation or safety constraints do not support it.

Community decision
A useful proposal explains a trade-off, not only a large total. It states what the water could support, what remains uncertain, and what evidence the school would need before acting. Learners can present a labelled model, a calculation board, or a short council briefing, then invite a challenge and improve the proposal.`,
  },
  studio: {
    title: "Rainwater Resilience Lab",
    subject: "Science",
    gradeLabel: "Class 8" as const,
    goal: "Design and defend a safe rainwater collection plan for one school garden using measurements, evidence, and a clearly stated efficiency assumption.",
    drivingQuestion: "How much rainwater could our school collect safely, and what evidence would make the estimate trustworthy?",
  },
  learnerWork: {
    prediction: "I predict the library roof could collect about 12,000 litres in a 100 millimetre month because its area is large enough to supply the garden.",
    firstDraft: "I used a roof length of 20 metres and width of 8 metres, so the area is 160 square metres. I multiplied 160 by 100 millimetres and got 16,000 litres. Then I added 80 percent efficiency and wrote 16,080 litres. I chose one 20,000 litre tank but did not include a first flush or overflow route.",
    selfCritique: "My estimate treats 80 percent as 80 extra litres instead of a multiplier. I also chose a tank before comparing usable water with capacity, and I did not explain how overflow would stay away from buildings and paths.",
    revision: "The roof estimate is 160 square metres multiplied by 100 millimetres, which is 16,000 litres. At an assumed collection efficiency of 0.80, the usable estimate is 12,800 litres. I propose two covered 6,500 litre tanks, a first-flush path, and an overflow route into the garden rain bed.",
    explanation: "This version is stronger because it keeps the units visible, applies the efficiency as a multiplier, states that 0.80 is an assumption, and checks storage capacity and overflow against the same rainfall scenario.",
    reflection: "I can now separate water reaching the roof, collection losses, and storage capacity. With less help next time, I will state each assumption before calculating and test the design with both a low-rainfall and a high-rainfall month.",
  },
  teacherReview: {
    noticedStrength: "In this activity, the learner found the percentage error, corrected the calculation, and added safety constraints before defending the revised design.",
    studentFeedback: "Your revision is convincing because you corrected the efficiency calculation, kept the units visible, and connected tank capacity, first flush, and overflow to the same evidence.",
    nextQuestion: "If rainfall falls to 60 millimetres, which parts of your design stay the same and which claim must change?",
    familyActivity: "Use a tray or sheet of paper as a pretend roof. Choose safe length and width measurements, calculate its area, then imagine 10 millimetres of rain. Ask the learner to estimate the litres before and after a collection-efficiency assumption. No one should climb or handle a real roof or gutter.",
  },
  familyResponse: {
    note: "We used a paper rectangle as the roof. The learner explained why the efficiency factor reduces the estimate and changed the answer after testing a smaller rainfall month.",
  },
} as const;
