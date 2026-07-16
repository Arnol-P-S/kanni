import { describe, expect, it } from "vitest";

import {
  LearningRecordSchema,
  SourceEntrySchema,
  TutorRequestSchema,
} from "@/lib/domain";
import { canIngestSource, createLearningRecord } from "@/lib/learning-record";
import { lessonPacks, sourceRegistry } from "@/lib/lessons";

describe("lesson and source contracts", () => {
  it("parses every source and keeps unknown rights link-only", () => {
    expect(sourceRegistry.map((source) => SourceEntrySchema.parse(source))).toHaveLength(3);
    expect(
      canIngestSource({ usage: "link_only", rightsBasis: "unknown" }),
    ).toBe(false);
    expect(
      canIngestSource({ usage: "ingested", rightsBasis: "original" }),
    ).toBe(true);
  });

  it("keeps section IDs unique across lesson packs", () => {
    const ids = Object.values(lessonPacks).flatMap((lesson) =>
      lesson.sections.map((section) => section.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rejects an invalid lesson-mode combination", () => {
    expect(() =>
      TutorRequestSchema.parse({
        lessonId: "math-add-within-10",
        language: "ml",
        mode: "custom_question",
        prompt: "2 + 3?",
      }),
    ).toThrow();
  });

  it("creates a valid synthetic learning record", () => {
    expect(
      LearningRecordSchema.parse(
        createLearningRecord("math-add-within-10", new Date(0)),
      ).profileId,
    ).toBe("demo-class-1");
  });
});
