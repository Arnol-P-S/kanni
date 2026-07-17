export const FRACTIONS_CONTENT_VERSION = "fractions-foundation-v3";

export const FRACTIONS_SECTION_IDS = [
  "fractions-goal",
  "fractions-visual",
  "fractions-misconceptions",
  "fractions-home",
] as const;

export type FractionsSectionId = (typeof FRACTIONS_SECTION_IDS)[number];

export type CurriculumSection = {
  id: FractionsSectionId;
  title: string;
  content: string;
  keywords: readonly string[];
  rightsBasis: "original";
  version: typeof FRACTIONS_CONTENT_VERSION;
  reviewedAt: string;
};

export const FRACTIONS_CURRICULUM: readonly CurriculumSection[] = [
  {
    id: "fractions-goal",
    title: "Equal wholes and unit fractions",
    content:
      "When the whole is the same size, one half is larger than one quarter. A half is one of two equal parts. A quarter is one of four equal parts.",
    keywords: [
      "fraction",
      "fractions",
      "half",
      "quarter",
      "equal whole",
      "equal wholes",
      "compare",
      "larger",
      "equal parts",
    ],
    rightsBasis: "original",
    version: FRACTIONS_CONTENT_VERSION,
    reviewedAt: "2026-07-17",
  },
  {
    id: "fractions-visual",
    title: "Compare with equal paper strips",
    content:
      "Compare two equal paper strips. Divide one into two equal parts and the other into four equal parts. Look at how much space one part from each strip takes.",
    keywords: [
      "fraction strip",
      "fraction strips",
      "paper strip",
      "paper strips",
      "visual",
      "show",
      "space one part takes",
      "space",
      "two parts",
      "four parts",
      "guided questions",
    ],
    rightsBasis: "original",
    version: FRACTIONS_CONTENT_VERSION,
    reviewedAt: "2026-07-17",
  },
  {
    id: "fractions-misconceptions",
    title: "Ideas to check, not labels for a learner",
    content:
      "Check whether the learner thinks a larger denominator always means a larger part, compares different-sized wholes, or compares only the digits. Treat these as ideas visible in this activity, never as a diagnosis of the learner.",
    keywords: [
      "misconception",
      "misconceptions",
      "likely misconception",
      "anticipate",
      "confusion",
      "mistake",
      "denominator",
      "different wholes",
      "compare digits",
    ],
    rightsBasis: "original",
    version: FRACTIONS_CONTENT_VERSION,
    reviewedAt: "2026-07-17",
  },
  {
    id: "fractions-home",
    title: "Short family activity",
    content:
      "Use two equal sheets. Fold one into two equal parts and the other into four equal parts. Ask the learner to compare one part from each sheet and explain what they notice. Keep it short and stop if the learner does not want to continue.",
    keywords: [
      "family",
      "home",
      "parent",
      "caregiver",
      "communicate",
      "family activity",
      "home activity",
      "fold",
      "sheets",
    ],
    rightsBasis: "original",
    version: FRACTIONS_CONTENT_VERSION,
    reviewedAt: "2026-07-17",
  },
] as const;

function normalize(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function relevanceScore(query: string, section: CurriculumSection): number {
  const normalizedQuery = normalize(query);
  return section.keywords.reduce((score, keyword) => {
    if (!normalizedQuery.includes(normalize(keyword))) return score;
    return score + keyword.split(/\s+/).length;
  }, 0);
}

export function retrieveCurriculumSections(
  query: string,
  limit = 3,
): CurriculumSection[] {
  if (!Number.isInteger(limit) || limit < 1 || limit > FRACTIONS_CURRICULUM.length) {
    throw new Error("Curriculum retrieval limit must be between 1 and 4.");
  }

  return FRACTIONS_CURRICULUM.map((section, index) => ({
    section,
    index,
    score: relevanceScore(query, section),
  }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map((candidate) => candidate.section);
}

export function citationsMatchRetrievedSections(
  citationIds: readonly string[],
  retrieved: readonly CurriculumSection[],
): boolean {
  if (citationIds.length === 0) return false;
  const retrievedIds = new Set(retrieved.map((section) => section.id));
  return citationIds.every((id) => retrievedIds.has(id as FractionsSectionId));
}

export function formatCurriculumContext(
  sections: readonly CurriculumSection[],
): string {
  return sections
    .map((section) => `[${section.id}] ${section.title}\n${section.content}`)
    .join("\n\n");
}
