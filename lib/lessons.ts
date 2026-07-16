import {
  SourceEntrySchema,
  type Language,
  type LessonId,
  type SourceEntry,
  type TutorResponse,
} from "@/lib/domain";

export type LessonSection = {
  id: string;
  title: Record<Language, string>;
  text: Record<Language, string>;
  sourceId: string;
};

export type LessonPack = {
  id: LessonId;
  title: Record<Language, string>;
  version: string;
  sections: LessonSection[];
  allowedCheckIds: string[];
  allowedConfusionCodes: string[];
};

const registryTimestamp = "2026-07-15T00:00:00.000Z";

export const sourceRegistry: SourceEntry[] = [
  {
    id: "kanni-math-original-v1",
    title: "Kanni original lesson: Addition within 10",
    author: "Kanni project",
    usage: "ingested",
    rightsBasis: "original",
    license: "CC BY 4.0",
    url: null,
    version: "1.1.0",
    retrievedAt: registryTimestamp,
    reviewedAt: null,
    checksum: null,
  },
  {
    id: "kanni-cs-original-v1",
    title: "Kanni original lesson: Linear search",
    author: "Kanni project",
    usage: "ingested",
    rightsBasis: "original",
    license: "CC BY 4.0",
    url: null,
    version: "1.0.0",
    retrievedAt: registryTimestamp,
    reviewedAt: null,
    checksum: null,
  },
  {
    id: "scert-subject-listing",
    title: "SCERT Kerala public textbook and subject listing",
    author: "SCERT Kerala",
    usage: "link_only",
    rightsBasis: "unknown",
    license: null,
    url: "https://scert.kerala.gov.in/standard-1/",
    version: "Public listing checked 2026-07-15",
    retrievedAt: registryTimestamp,
    reviewedAt: null,
    checksum: null,
  },
].map((entry) => SourceEntrySchema.parse(entry));

export const lessonPacks: Record<LessonId, LessonPack> = {
  "math-add-within-10": {
    id: "math-add-within-10",
    title: { ml: "10-നുള്ളിലെ കൂട്ടൽ", en: "Addition within 10" },
    version: "math-1.1.0",
    allowedCheckIds: ["math-check-post-1"],
    allowedConfusionCodes: ["needs_counting_support"],
    sections: [
      {
        id: "math-add-objects",
        title: { ml: "വസ്തുക്കൾ ചേർക്കുക", en: "Join objects" },
        text: {
          ml: "ആദ്യം ഒരു കൂട്ടത്തിലെ വസ്തുക്കൾ എണ്ണുക. രണ്ടാമത്തെ കൂട്ടം അതിനോട് ചേർക്കുക. എല്ലാം കൂടി വീണ്ടും എണ്ണുക. അവസാന എണ്ണം ആകെ ആണ്.",
          en: "Count the first group. Join the second group to it. Count every object once. The last number is the total.",
        },
        sourceId: "kanni-math-original-v1",
      },
      {
        id: "math-add-count-on",
        title: { ml: "മുന്നോട്ട് എണ്ണുക", en: "Count on" },
        text: {
          ml: "വലിയ സംഖ്യ മനസ്സിൽ വയ്ക്കുക. ചേർക്കുന്ന ചെറിയ സംഖ്യയുടെ അത്ര പടി മുന്നോട്ട് എണ്ണുക.",
          en: "Keep the larger number in mind. Count forward as many steps as the smaller number says.",
        },
        sourceId: "kanni-math-original-v1",
      },
      {
        id: "math-add-check",
        title: { ml: "ഉത്തരം പരിശോധിക്കുക", en: "Check the answer" },
        text: {
          ml: "രണ്ട് കൂട്ടങ്ങളും വീണ്ടും കാണിച്ച് ഓരോ വസ്തുവും ഒരിക്കൽ മാത്രം എണ്ണുക. ആകെ 10-ൽ കൂടുതലാകരുത്.",
          en: "Show both groups again and count every object exactly once. The total in this lesson will not be more than 10.",
        },
        sourceId: "kanni-math-original-v1",
      },
    ],
  },
  "cs-linear-search": {
    id: "cs-linear-search",
    title: { ml: "ലീനിയർ സെർച്ച്", en: "Linear search" },
    version: "cs-1.0.0",
    allowedCheckIds: ["cs-check-trace-1", "cs-check-complexity-1"],
    allowedConfusionCodes: [
      "stops_before_match",
      "confuses_index_and_value",
      "misses_not_found_case",
    ],
    sections: [
      {
        id: "cs-linear-definition",
        title: { ml: "നിർവചനം", en: "Definition" },
        text: {
          ml: "ലീനിയർ സെർച്ച് ഒരു ലിസ്റ്റിന്റെ തുടക്കം മുതൽ ഓരോ ഇനവും ക്രമത്തിൽ പരിശോധിച്ച് ലക്ഷ്യം കണ്ടെത്തുന്ന അൽഗോരിതമാണ്.",
          en: "Linear search checks items in order from the start of a list until it finds the target or reaches the end.",
        },
        sourceId: "kanni-cs-original-v1",
      },
      {
        id: "cs-linear-steps",
        title: { ml: "നടപടികൾ", en: "Steps" },
        text: {
          ml: "ആദ്യ ഇനത്തിൽ തുടങ്ങുക. നിലവിലെ ഇനം target-നോട് തുല്യമാണോ എന്ന് നോക്കുക. തുല്യമെങ്കിൽ സ്ഥാനം നൽകുക. അല്ലെങ്കിൽ അടുത്ത ഇനത്തിലേക്ക് നീങ്ങുക. അവസാനം വരെ കിട്ടിയില്ലെങ്കിൽ not found നൽകുക.",
          en: "Start at the first item. Compare it with the target. Return its position if it matches. Otherwise move to the next item. Return not found after the final item.",
        },
        sourceId: "kanni-cs-original-v1",
      },
      {
        id: "cs-linear-trace",
        title: { ml: "ട്രേസ് ഉദാഹരണം", en: "Trace example" },
        text: {
          ml: "[4, 7, 9] ൽ 7 അന്വേഷിക്കുമ്പോൾ ആദ്യം 4 പരിശോധിക്കുന്നു. അത് പൊരുത്തപ്പെടുന്നില്ല. അടുത്തത് 7 ആണ്, അതിനാൽ തിരച്ചിൽ അവിടെ നിർത്തുന്നു.",
          en: "To find 7 in [4, 7, 9], compare 7 with 4 first. It does not match. The next item is 7, so the search stops there.",
        },
        sourceId: "kanni-cs-original-v1",
      },
      {
        id: "cs-linear-complexity",
        title: { ml: "പ്രവർത്തനച്ചെലവ്", en: "Work and complexity" },
        text: {
          ml: "മികച്ച സാഹചര്യത്തിൽ ആദ്യ ഇനം തന്നെ target ആണ്. ഏറ്റവും മോശം സാഹചര്യത്തിൽ n ഇനങ്ങളും പരിശോധിക്കണം. അതിനാൽ worst-case time complexity O(n) ആണ്.",
          en: "The best case checks one item. In the worst case, the algorithm checks all n items, so its worst-case time complexity is O(n).",
        },
        sourceId: "kanni-cs-original-v1",
      },
      {
        id: "cs-linear-uses",
        title: { ml: "എവിടെ ഉപയോഗിക്കുന്നു", en: "Where it is used" },
        text: {
          ml: "ചെറിയതോ ക്രമീകരിക്കാത്തതോ ആയ ഡാറ്റയിൽ ഒരു മൂല്യം കണ്ടെത്താൻ ലീനിയർ സെർച്ച് ഉപയോഗിക്കാം. പ്രോഗ്രാം ഡീബഗ് ചെയ്യുമ്പോൾ മൂല്യങ്ങൾ ക്രമത്തിൽ പരിശോധിക്കുന്നതും സമാനമായ ചിന്തയാണ്.",
          en: "Linear search is useful for finding a value in a small or unsorted collection. Checking values in order while debugging uses the same kind of thinking.",
        },
        sourceId: "kanni-cs-original-v1",
      },
    ],
  },
};

export function getLesson(lessonId: LessonId): LessonPack {
  return lessonPacks[lessonId];
}

export function getSource(sourceId: string): SourceEntry | undefined {
  return sourceRegistry.find((source) => source.id === sourceId);
}

export function getSection(sectionId: string): LessonSection | undefined {
  return Object.values(lessonPacks)
    .flatMap((lesson) => lesson.sections)
    .find((section) => section.id === sectionId);
}

export const suggestedLinearSearchAnswers: Record<string, TutorResponse> = {
  "what-is-linear-search": {
    status: "grounded",
    explanation:
      "Linear search checks a list from the first item to the last. It stops when the target matches an item. If every item has been checked without a match, the result is not found.",
    steps: [
      "Start at the first item.",
      "Compare the item with the target.",
      "Stop on a match, or continue until the list ends.",
    ],
    hint: null,
    recommendedCheckId: "cs-check-trace-1",
    sourceSectionIds: ["cs-linear-definition", "cs-linear-steps"],
    possibleConfusionCode: null,
    trust: {
      sourceMatched: true,
      citationIdsValid: true,
      ageFormatChecked: true,
      safetyRoute: "clear",
      contentOrigin: "project_authored",
    },
    deepCheck: null,
  },
  "trace-an-example": {
    status: "grounded",
    explanation:
      "For [4, 7, 9] with target 7, compare 7 with 4 first. They do not match. Compare 7 with the next item, 7. They match, so the search stops at index 1.",
    steps: ["Index 0: 4 is not 7.", "Index 1: 7 is 7. Stop."],
    hint: null,
    recommendedCheckId: "cs-check-trace-1",
    sourceSectionIds: ["cs-linear-trace"],
    possibleConfusionCode: null,
    trust: {
      sourceMatched: true,
      citationIdsValid: true,
      ageFormatChecked: true,
      safetyRoute: "clear",
      contentOrigin: "project_authored",
    },
    deepCheck: null,
  },
};
