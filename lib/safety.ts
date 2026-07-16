import type { Language, LessonId, TutorResponse } from "@/lib/domain";

export type PromptRoute =
  | "generate"
  | "unsupported"
  | "safety_redirect";

const highRiskPatterns = [
  /\b(hurt|harm|kill)\s+myself\b|\bsuicid(?:e|al)\b/i,
  /\b(want to die|do not want to live|don['’]?t want to live|end my life|end it all|going to end my life)\b/i,
  /\b(?:plan(?:ning)? to |going to )?(?:take|end)\s+my\s+(?:own\s+)?life\b/i,
  /\b(immediate danger|not safe at home|someone has a weapon|threatened (?:me|us)|locked me in)\b/i,
  /\b(someone|father|mother|parent|dad|mum|uncle|aunt|teacher|coach|neighbou?r)\s+(?:is\s+|has\s+)?(?:touch(?:ing|ed)?|hit(?:s|ting)?|beat(?:s|ing)?|hurt(?:s|ing)?|abus(?:es|ing|ed))\s+me\b/i,
  /\b(?:i am|i['’]?m|i was)\s+being\s+(?:touched|hit|hurt|beaten|abused)\b/i,
  /\b(?:hurt|harm|kill|attack)\s+(?:someone|him|her|them|another person)\b/i,
  /\b(?:adult|someone)\s+(?:asked|asks|is asking)\s+me\s+for\s+(?:private|nude|naked)\s+(?:photos?|pictures?)\b/i,
  /\bgroom(?:ing|ed)?\b|\bsexual abuse\b|\bdomestic violence\b/i,
  /ജീവിക്കേണ്ട|ആത്മഹത്യ|മരിക്കണം|ജീവൻ അവസാനിപ്പ|എന്നെ ഉപദ്രവ|എന്നെ അടിക്ക|എന്നെ തല്ല|എന്നെ തൊട|അപകടം|പീഡനം|കൊല്ലണം/u,
];

const personalDataPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+?91[\s-]*)?[6-9](?:[\s-]*\d){9}\b/u,
  /\bmy name is\b|\bi am called\b|\bi study at\b|\bmy school\b|\bmy address\b|\bi live at\b/i,
  /\b(?:i\s+(?:attend|go to)|i['’]?m\s+(?:a student\s+)?at)\s+[^.?!]{0,80}\bschool\b/i,
  /\b\d{1,5}\s+[A-Z][A-Za-z.' -]{1,40}\s(?:road|street|lane|avenue|nagar|colony)\b/i,
  /\b(?:date of birth|birth date|d\.?o\.?b\.?|aadhaa?r|home address|postal code|pin code|whats ?app number|social media handle)\b/i,
  /\b(?:my|i have)\s+(?:(?:a|an|the)\s+)?(?:medical|health|mental health)\s+(?:history|condition|diagnosis|problem)\b/i,
  /എന്റെ പേര്|എന്റെ സ്കൂൾ|എന്റെ school|എന്റെ വിലാസം|വിലാസം|ഞാൻ താമസിക്കുന്നത്/u,
];

const injectionAndCheatingPatterns = [
  /(?:ignore|disregard|forget) (?:all |the |any )?(?:previous|earlier|system|developer) instructions/i,
  /reveal (the |your )?(system|developer) prompt/i,
  /outside knowledge|invent (a )?source|override (the )?source|jailbreak|system message/i,
  /repeat (?:the )?(?:hidden|text above)|act as (?:a )?different assistant|you are now|developer mode|new instructions/i,
  /(?:show|print|leak|expose) (?:the |your )?(?:hidden|private|internal) (?:prompt|instructions|rules)/i,
  /<\s*\/?\s*(?:learner_question|reviewed_context|trusted_context|candidate_answer)\b/i,
  /answer (only|key)|exact answer.*exam|do my (homework|exam)/i,
  /മുൻ നിർദ്ദേശങ്ങൾ മറന്ന്|answer മാത്രം|പരീക്ഷ.*ഉത്തരം/u,
];

const disallowedAdvicePatterns = [
  /career|which stream|choose.*stream|recommend.*stream/i,
  /grade me|rank me|diagnos|am i (smart|good at)/i,
  /ഏത് career|ഏത് സ്ട്രീം|എന്നെ grade|റാങ്ക്/u,
];

const linearSearchTopicPatterns = [
  /\b(?:linear|sequential)\s+search\b/i,
  /\b(?:array|list|collection)\b.{0,50}\b(?:search|find|index|comparison|not found|algorithm)\b/i,
  /\b(?:search|find|index|comparison|not found|algorithm)\b.{0,50}\b(?:array|list|collection)\b/i,
  /\b(?:trace|show|run)\b.{0,30}\bsearch\b.{0,30}\[[^\]]+\]/i,
  /\b(?:time complexity|worst case|best case|O\s*\(n\))\b/i,
  /ലീനിയർ\s*(?:സെർച്ച്|search)|സെർച്ച്|തിരച്ചിൽ/u,
  /(?:list|array|ലിസ്റ്റ്).{0,60}(?:ഇനം|ലക്ഷ്യം|നോക്ക|പരിശോധ|കണ്ടെത്ത|കിട്ട)/iu,
];

type PromptRule = {
  id: string;
  route: Exclude<PromptRoute, "generate">;
  matches: (prompt: string) => boolean;
};

export function normalizeForScreening(rawPrompt: string): string {
  return rawPrompt
    .normalize("NFKC")
    .replace(/\p{Cf}/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function matchesAny(patterns: RegExp[], prompt: string): boolean {
  return patterns.some((pattern) => pattern.test(prompt));
}

export function containsHighRiskContent(prompt: string): boolean {
  return matchesAny(highRiskPatterns, normalizeForScreening(prompt));
}

export function containsPersonalData(prompt: string): boolean {
  return matchesAny(personalDataPatterns, normalizeForScreening(prompt));
}

const boundaryRules: PromptRule[] = [
  {
    id: "high_risk",
    route: "safety_redirect",
    matches: (prompt) => matchesAny(highRiskPatterns, prompt),
  },
  {
    id: "personal_data",
    route: "unsupported",
    matches: (prompt) => matchesAny(personalDataPatterns, prompt),
  },
  {
    id: "prompt_injection_or_cheating",
    route: "unsupported",
    matches: (prompt) => matchesAny(injectionAndCheatingPatterns, prompt),
  },
  {
    id: "disallowed_advice",
    route: "unsupported",
    matches: (prompt) => matchesAny(disallowedAdvicePatterns, prompt),
  },
];

export function classifyPromptDetailed(
  lessonId: LessonId,
  rawPrompt: string,
): { route: PromptRoute; ruleId: string } {
  const prompt = normalizeForScreening(rawPrompt);
  const boundary = boundaryRules.find((rule) => rule.matches(prompt));
  if (boundary) return { route: boundary.route, ruleId: boundary.id };

  if (lessonId === "math-add-within-10") {
    return { route: "generate", ruleId: "guided_math" };
  }
  if (matchesAny(linearSearchTopicPatterns, prompt)) {
    return { route: "generate", ruleId: "linear_search_topic" };
  }
  return { route: "unsupported", ruleId: "off_topic" };
}

export function classifyPrompt(
  lessonId: LessonId,
  rawPrompt: string,
): PromptRoute {
  return classifyPromptDetailed(lessonId, rawPrompt).route;
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
          ? "ഇത് ഒരു പഠന ചോദ്യത്തേക്കാൾ പ്രധാനപ്പെട്ട കാര്യമാണ്. ഇപ്പോൾ വിശ്വസിക്കുന്ന ഒരു മുതിർന്നയാളോട് പറയുക. ഉടൻ അപകടമുണ്ടെങ്കിൽ 112-ൽ വിളിക്കുക. കുട്ടികൾക്ക് Child Helpline 1098-ലും മാനസികാരോഗ്യ സഹായത്തിന് Tele-MANAS 14416-ലും വിളിക്കാം."
          : "This is more important than a lesson question. Tell a trusted adult now. If anyone is in immediate danger, call 112. Children can also call Child Helpline at 1098, and Tele-MANAS is available at 14416 for mental health support.",
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
        contentOrigin: "project_authored",
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
      contentOrigin: "project_authored",
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
        : "AI help is unavailable right now. The project-authored hints and suggested questions still work.",
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
      contentOrigin: "project_authored",
    },
    deepCheck: null,
  };
}
