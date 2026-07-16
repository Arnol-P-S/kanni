import type { Language, LessonId, TutorResponse } from "@/lib/domain";

export type PromptRoute =
  | "generate"
  | "unsupported"
  | "safety_redirect";

const highRiskPatterns = [
  /hurt myself|kill myself|suicide|want to die|immediate danger/i,
  /someone (is )?(touching|hurting|abusing) me/i,
  /groom(ing|ed)?|sexual abuse|domestic violence/i,
  /ജീവിക്കേണ്ട|ആത്മഹത്യ|എന്നെ ഉപദ്രവ|അപകടം|പീഡനം/u,
];

const personalDataPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+91[\s-]?)?[6-9]\d{9}/,
  /\bmy name is\b|\bi study at\b|\bmy school\b|\bmy address\b/i,
  /എന്റെ പേര്|എന്റെ സ്കൂൾ|എന്റെ school|വിലാസം/u,
];

const injectionAndCheatingPatterns = [
  /ignore (all |the |any )?(previous|earlier) instructions/i,
  /reveal (the |your )?(system|developer) prompt/i,
  /outside knowledge|invent (a )?source|override (the )?source/i,
  /answer (only|key)|exact answer.*exam|do my (homework|exam)/i,
  /മുൻ നിർദ്ദേശങ്ങൾ മറന്ന്|answer മാത്രം|പരീക്ഷ.*ഉത്തരം/u,
];

const disallowedAdvicePatterns = [
  /career|which stream|choose.*stream|recommend.*stream/i,
  /grade me|rank me|diagnos|am i (smart|good at)/i,
  /ഏത് career|ഏത് സ്ട്രീം|എന്നെ grade|റാങ്ക്/u,
];

const linearSearchTopicPatterns = [
  /linear|search|array|list|item|target|trace|algorithm/i,
  /index|value|not found|comparison|complexity|worst case|O\s*\(n\)/i,
  /ലീനിയർ|സെർച്ച്|തിരച്ചിൽ|ലിസ്റ്റ്|ഇനം|ലക്ഷ്യം|കണ്ടെത്ത|പരിശോധ/u,
];

export function containsPersonalData(prompt: string): boolean {
  return personalDataPatterns.some((pattern) => pattern.test(prompt));
}

export function classifyPrompt(
  lessonId: LessonId,
  rawPrompt: string,
): PromptRoute {
  const prompt = rawPrompt.normalize("NFC").trim();

  if (highRiskPatterns.some((pattern) => pattern.test(prompt))) {
    return "safety_redirect";
  }
  if (
    containsPersonalData(prompt) ||
    injectionAndCheatingPatterns.some((pattern) => pattern.test(prompt)) ||
    disallowedAdvicePatterns.some((pattern) => pattern.test(prompt))
  ) {
    return "unsupported";
  }
  if (lessonId === "math-add-within-10") {
    return "generate";
  }
  return linearSearchTopicPatterns.some((pattern) => pattern.test(prompt))
    ? "generate"
    : "unsupported";
}

export function boundaryResponse(
  route: Exclude<PromptRoute, "generate">,
  language: Language,
): TutorResponse {
  if (route === "safety_redirect") {
    return {
      status: "safety_redirect",
      explanation:
        language === "ml"
          ? "ഇത് ഒരു പഠന ചോദ്യത്തേക്കാൾ പ്രധാനപ്പെട്ട കാര്യമാണ്. ഇപ്പോൾ വിശ്വസിക്കുന്ന ഒരു മുതിർന്നയാളോട് പറയുക. ഉടൻ അപകടമുണ്ടെങ്കിൽ 112-ൽ വിളിക്കുക. കുട്ടികൾക്ക് Childline 1098-ലും മാനസികാരോഗ്യ സഹായത്തിന് Tele-MANAS 14416-ലും വിളിക്കാം."
          : "This is more important than a lesson question. Tell a trusted adult now. If anyone is in immediate danger, call 112. Children can also call Childline at 1098, and Tele-MANAS is available at 14416 for mental health support.",
      steps: [],
      hint: null,
      recommendedCheckId: null,
      sourceSectionIds: [],
      possibleConfusionCode: null,
      trust: {
        sourceMatched: false,
        citationIdsValid: true,
        ageFormatChecked: true,
        safetyRoute: "static_redirect",
        humanReview: "completed",
      },
      deepCheck: null,
    };
  }

  return {
    status: "unsupported",
    explanation:
      language === "ml"
        ? "ഈ പ്രോട്ടോടൈപ്പ് ഈ പാഠത്തെക്കുറിച്ചുള്ള ചോദ്യങ്ങൾക്ക് മാത്രം മറുപടി നൽകുന്നു. പേര്, സ്കൂൾ, ഫോൺ നമ്പർ, ഇമെയിൽ എന്നിവ നീക്കി ഒരു പഠന ചോദ്യം ചോദിക്കൂ. പരീക്ഷയുടെ നേരിട്ടുള്ള ഉത്തരമോ വ്യക്തിഗത career ഉപദേശമോ കന്നി നൽകില്ല."
        : "This prototype answers questions about this lesson only. Remove names, school details, phone numbers, and email addresses before asking. Kanni does not provide exam answer keys or personalised career advice.",
    steps: [],
    hint: null,
    recommendedCheckId: null,
    sourceSectionIds: [],
    possibleConfusionCode: null,
    trust: {
      sourceMatched: false,
      citationIdsValid: true,
      ageFormatChecked: true,
      safetyRoute: "static_redirect",
      humanReview: "completed",
    },
    deepCheck: null,
  };
}

export function unavailableResponse(language: Language): TutorResponse {
  return {
    status: "unavailable",
    explanation:
      language === "ml"
        ? "ഇപ്പോൾ AI സഹായം ലഭ്യമല്ല. പരിശോധിച്ച നിർദ്ദേശങ്ങളും ചോദ്യങ്ങളും ഇപ്പോഴും ഉപയോഗിക്കാം."
        : "AI help is unavailable right now. The reviewed hints and suggested questions still work.",
    steps: [],
    hint: null,
    recommendedCheckId: null,
    sourceSectionIds: [],
    possibleConfusionCode: null,
    trust: {
      sourceMatched: false,
      citationIdsValid: false,
      ageFormatChecked: true,
      safetyRoute: "clear",
      humanReview: "completed",
    },
    deepCheck: null,
  };
}
