import { createHash } from "node:crypto";

export const INGESTIBLE_RIGHTS_BASES = [
  "original",
  "cc_by_4_0",
  "public_domain",
  "written_permission",
] as const;

export type RightsBasis = (typeof INGESTIBLE_RIGHTS_BASES)[number];

export type CurriculumSectionRecord = {
  referenceId: string;
  heading: string;
  content: string;
  position: number;
  checksum: string;
};

export type RetrievedCurriculumSection = CurriculumSectionRecord & {
  score: number;
};

const MAX_SECTION_CHARACTERS = 1_400;
const MIN_SECTION_CHARACTERS = 40;

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "use",
  "what",
  "when",
  "with",
]);

export function normalizeCurriculumText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongBlock(block: string): string[] {
  if (block.length <= MAX_SECTION_CHARACTERS) return [block];

  const sentences = block
    .split(/(?<=[.!?।])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > MAX_SECTION_CHARACTERS) {
      if (current) chunks.push(current);
      current = "";
      for (let index = 0; index < sentence.length; index += MAX_SECTION_CHARACTERS) {
        chunks.push(sentence.slice(index, index + MAX_SECTION_CHARACTERS).trim());
      }
      continue;
    }
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > MAX_SECTION_CHARACTERS) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function sectionParts(block: string, index: number): { heading: string; content: string } {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "";
  const looksLikeHeading =
    lines.length > 1 &&
    firstLine.length >= 3 &&
    firstLine.length <= 100 &&
    !/[.!?।]$/u.test(firstLine);

  if (looksLikeHeading) {
    return {
      heading: firstLine,
      content: lines.slice(1).join(" "),
    };
  }
  return {
    heading: `Section ${index + 1}`,
    content: lines.join(" "),
  };
}

export function splitCurriculumIntoSections(sourceText: string): CurriculumSectionRecord[] {
  const normalized = normalizeCurriculumText(sourceText);
  if (!normalized) return [];

  const blocks = normalized
    .split(/\n\s*\n+/u)
    .flatMap(splitLongBlock)
    .map((block) => block.trim())
    .filter((block) => block.length >= MIN_SECTION_CHARACTERS);

  return blocks.map((block, index) => {
    const { heading, content } = sectionParts(block, index);
    return {
      referenceId: `SEC-${String(index + 1).padStart(3, "0")}`,
      heading,
      content,
      position: index + 1,
      checksum: createHash("sha256").update(`${heading}\n${content}`).digest("hex"),
    };
  });
}

export function tokenizeForRetrieval(value: string): string[] {
  return (
    normalizeCurriculumText(value)
      .toLocaleLowerCase("en-IN")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  ).filter((token) => token.length > 1 && !stopWords.has(token));
}

export function retrieveCurriculumSections(
  sections: readonly CurriculumSectionRecord[],
  query: string,
  limit = 6,
): RetrievedCurriculumSection[] {
  const queryTokens = [...new Set(tokenizeForRetrieval(query))];
  if (queryTokens.length === 0 || sections.length === 0 || limit < 1) return [];

  const documentTokens = sections.map((section) => ({
    heading: tokenizeForRetrieval(section.heading),
    content: tokenizeForRetrieval(section.content),
  }));
  const documentFrequency = new Map<string, number>();
  for (const token of queryTokens) {
    documentFrequency.set(
      token,
      documentTokens.filter(({ heading, content }) =>
        heading.includes(token) || content.includes(token),
      ).length,
    );
  }

  return sections
    .map((section, index) => {
      const headingTokens = documentTokens[index].heading;
      const contentTokens = documentTokens[index].content;
      const contentFrequency = new Map<string, number>();
      for (const token of contentTokens) {
        contentFrequency.set(token, (contentFrequency.get(token) ?? 0) + 1);
      }
      const score = queryTokens.reduce((total, token) => {
        const frequency = contentFrequency.get(token) ?? 0;
        const headingMatch = headingTokens.includes(token) ? 2.5 : 0;
        const documentsWithToken = documentFrequency.get(token) ?? 0;
        const inverseFrequency = Math.log((sections.length + 1) / (documentsWithToken + 1)) + 1;
        return total + (Math.min(frequency, 4) + headingMatch) * inverseFrequency;
      }, 0);
      return { ...section, score: Number(score.toFixed(4)) };
    })
    .filter((section) => section.score > 0)
    .sort((left, right) => right.score - left.score || left.position - right.position)
    .slice(0, Math.min(limit, 8));
}

export function citationsMatchRetrievedSections(
  citationIds: readonly string[],
  retrieved: readonly Pick<CurriculumSectionRecord, "referenceId">[],
): boolean {
  if (citationIds.length === 0 || new Set(citationIds).size !== citationIds.length) {
    return false;
  }
  const allowed = new Set(retrieved.map((section) => section.referenceId));
  return citationIds.every((id) => allowed.has(id));
}

export function escapePromptMarkup(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function formatCurriculumContext(
  sections: readonly CurriculumSectionRecord[],
): string {
  return sections
    .map(
      (section) =>
        `<curriculum-section id="${section.referenceId}">\n<title>${escapePromptMarkup(section.heading)}</title>\n<content>${escapePromptMarkup(section.content)}</content>\n</curriculum-section>`,
    )
    .join("\n\n");
}

export function sourceNeedsLinkOnlyTreatment(sourceUrl: string | null | undefined): boolean {
  if (!sourceUrl) return false;
  try {
    const hostname = new URL(sourceUrl).hostname.toLocaleLowerCase("en-US");
    return [
      "scert.kerala.gov.in",
      "textbooksarchives.scert.kerala.gov.in",
      "samagra.kite.kerala.gov.in",
    ].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return true;
  }
}
