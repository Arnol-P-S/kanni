import type {
  GuidedAnswerId,
  GuidedQuestionId,
  Language,
  MathTeacherStrategy,
  TeacherStrategy,
} from "@/lib/domain";

export type GuidedOption = {
  id: GuidedAnswerId;
  value: number;
  correct: boolean;
};

export type GuidedVisual =
  | { type: "counters"; groups: [number, number] }
  | { type: "number_line"; start: number; jumps: number; end: number };

export type GuidedHintContext = {
  id: GuidedQuestionId;
  question: Record<Language, string>;
  fixedHint: Record<Language, string>;
  focusSectionId:
    | "math-add-objects"
    | "math-add-count-on"
    | "math-add-check";
  visual: GuidedVisual;
  options: GuidedOption[];
  correctAnswerForms: string[];
};

export const guidedHintContexts: Record<GuidedQuestionId, GuidedHintContext> = {
  "math-join-2-3": {
    id: "math-join-2-3",
    question: {
      ml: "രണ്ട് വൃത്തങ്ങളും മൂന്ന് വൃത്തങ്ങളും ചേർന്നാൽ ആകെ എത്ര?",
      en: "How many circles are there when two and three are joined?",
    },
    fixedHint: {
      ml: "ആദ്യം രണ്ട് വൃത്തങ്ങൾ എണ്ണൂ. പിന്നെ മൂന്ന് വൃത്തങ്ങൾ കൂടി ചേർത്ത് എല്ലാം ഒരിക്കൽ കൂടി എണ്ണൂ.",
      en: "Count two circles first. Join three more, then count every circle once.",
    },
    focusSectionId: "math-add-objects",
    visual: { type: "counters", groups: [2, 3] },
    options: [
      { id: "math-join-2-3-answer-4", value: 4, correct: false },
      { id: "math-join-2-3-answer-5", value: 5, correct: true },
      { id: "math-join-2-3-answer-6", value: 6, correct: false },
    ],
    correctAnswerForms: ["5", "five", "അഞ്ച്"],
  },
  "math-objects-3-1": {
    id: "math-objects-3-1",
    question: {
      ml: "മൂന്ന് വൃത്തങ്ങളും ഒരു വൃത്തവും ചേർന്നാൽ ആകെ എത്ര?",
      en: "How many circles are there when three and one are joined?",
    },
    fixedHint: {
      ml: "മൂന്ന് വൃത്തങ്ങൾ എണ്ണൂ. ഒരു വൃത്തം കൂടി ചേർത്ത് എല്ലാം ഒരിക്കൽ കൂടി എണ്ണൂ.",
      en: "Count three circles. Join one more, then count every circle once.",
    },
    focusSectionId: "math-add-objects",
    visual: { type: "counters", groups: [3, 1] },
    options: [
      { id: "math-objects-3-1-answer-3", value: 3, correct: false },
      { id: "math-objects-3-1-answer-4", value: 4, correct: true },
      { id: "math-objects-3-1-answer-5", value: 5, correct: false },
    ],
    correctAnswerForms: ["4", "four", "നാല്"],
  },
  "math-number-line-4-2": {
    id: "math-number-line-4-2",
    question: {
      ml: "നാല് മുതൽ സംഖ്യാരേഖയിൽ രണ്ട് ചാട്ടം മുന്നോട്ട് പോയാൽ എവിടെ എത്തും?",
      en: "Start at four on the number line and make two jumps forward. Where do you land?",
    },
    fixedHint: {
      ml: "നാലിൽ വിരൽ വയ്ക്കൂ. ഓരോ ചാട്ടത്തിനും ഒരു സംഖ്യ വീതം മുന്നോട്ട് നീങ്ങൂ.",
      en: "Put your finger on four. Move forward one number for each jump.",
    },
    focusSectionId: "math-add-count-on",
    visual: { type: "number_line", start: 4, jumps: 2, end: 6 },
    options: [
      { id: "math-number-line-4-2-answer-5", value: 5, correct: false },
      { id: "math-number-line-4-2-answer-6", value: 6, correct: true },
      { id: "math-number-line-4-2-answer-7", value: 7, correct: false },
    ],
    correctAnswerForms: ["6", "six", "ആറ്"],
  },
  "math-smaller-1-2": {
    id: "math-smaller-1-2",
    question: {
      ml: "ഒരു വൃത്തവും രണ്ട് വൃത്തങ്ങളും ചേർന്നാൽ ആകെ എത്ര?",
      en: "How many circles are there when one and two are joined?",
    },
    fixedHint: {
      ml: "ഒരു വൃത്തം എണ്ണൂ. രണ്ട് വൃത്തങ്ങൾ കൂടി ചേർത്ത് എല്ലാം ഒരിക്കൽ കൂടി എണ്ണൂ.",
      en: "Count one circle. Join two more, then count every circle once.",
    },
    focusSectionId: "math-add-objects",
    visual: { type: "counters", groups: [1, 2] },
    options: [
      { id: "math-smaller-1-2-answer-2", value: 2, correct: false },
      { id: "math-smaller-1-2-answer-3", value: 3, correct: true },
      { id: "math-smaller-1-2-answer-4", value: 4, correct: false },
    ],
    correctAnswerForms: ["3", "three", "മൂന്ന്"],
  },
  "math-check-2-3": {
    id: "math-check-2-3",
    question: {
      ml: "രണ്ടും മൂന്നും ചേർത്തപ്പോൾ ഒരേ വൃത്തം രണ്ടുതവണ എണ്ണി ആറെന്ന് പറഞ്ഞു.",
      en: "While joining two and three, the learner counted one circle twice and said six.",
    },
    fixedHint: {
      ml: "ഓരോ വൃത്തവും ഒരിക്കൽ മാത്രം തൊട്ട് വീണ്ടും എണ്ണൂ.",
      en: "Touch each circle once and count the two groups again.",
    },
    focusSectionId: "math-add-check",
    visual: { type: "counters", groups: [2, 3] },
    options: [
      { id: "math-check-2-3-answer-6", value: 6, correct: false },
    ],
    correctAnswerForms: ["5", "five", "അഞ്ച്"],
  },
};

const strategyQuestionIds: Record<MathTeacherStrategy, GuidedQuestionId> = {
  use_objects: "math-objects-3-1",
  use_number_line: "math-number-line-4-2",
  use_smaller_numbers: "math-smaller-1-2",
};

export function getGuidedHintContext(
  questionId: GuidedQuestionId,
): GuidedHintContext {
  return guidedHintContexts[questionId];
}

export function getNextMathActivity(
  strategy: TeacherStrategy | null,
): GuidedHintContext {
  if (
    strategy === "use_objects" ||
    strategy === "use_number_line" ||
    strategy === "use_smaller_numbers"
  ) {
    return guidedHintContexts[strategyQuestionIds[strategy]];
  }
  return guidedHintContexts["math-join-2-3"];
}

export function getGuidedAttempt(
  questionId: GuidedQuestionId,
  selectedAnswerId: GuidedAnswerId,
): { context: GuidedHintContext; selectedOption: GuidedOption } | null {
  const context = getGuidedHintContext(questionId);
  const selectedOption = context.options.find(
    (option) => option.id === selectedAnswerId,
  );
  if (!selectedOption || selectedOption.correct) return null;
  return { context, selectedOption };
}

export function containsGuidedAnswerLeak(
  questionId: GuidedQuestionId,
  content: string,
): boolean {
  const normalized = content.normalize("NFKC").toLocaleLowerCase("en");
  return getGuidedHintContext(questionId).correctAnswerForms.some((form) => {
    const normalizedForm = form.normalize("NFKC").toLocaleLowerCase("en");
    if (/^\d+$/u.test(normalizedForm)) {
      return new RegExp(`(^|\\D)${normalizedForm}(\\D|$)`, "u").test(normalized);
    }
    return normalized.includes(normalizedForm);
  });
}
