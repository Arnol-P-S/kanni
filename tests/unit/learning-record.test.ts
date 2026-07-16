import { describe, expect, it } from "vitest";

import {
  createLearningRecord,
  getNextActivityMessage,
  getParentSummary,
  parseStoredLearningRecord,
  recordAttempt,
  selectTeacherStrategy,
} from "@/lib/learning-record";

describe("connected learning-record transitions", () => {
  it("records incorrect, hint, correct follow-up as one observed event", () => {
    const start = createLearningRecord(
      "math-add-within-10",
      new Date("2026-07-15T10:00:00.000Z"),
    );
    const afterIncorrect = recordAttempt(
      start,
      {
        questionId: "math-pre-1",
        selectedOptionId: "pre-4",
        correct: false,
      },
      {
        hintUsed: true,
        possibleConfusionCode: "needs_counting_support",
        now: new Date("2026-07-15T10:01:00.000Z"),
      },
    );
    const afterFollowUp = recordAttempt(
      afterIncorrect,
      {
        questionId: "math-post-1",
        selectedOptionId: "post-6",
        correct: true,
      },
      { now: new Date("2026-07-15T10:02:00.000Z") },
    );

    expect(afterFollowUp.observation).toBe("correct_after_hint");
    expect(afterFollowUp.hintUsed).toBe(true);
    expect(afterFollowUp.attempts).toHaveLength(2);
    expect(afterFollowUp.reviewState).toBe("pending_review");
  });

  it("applies a teacher strategy to the parent and next learner activity", () => {
    const reviewed = selectTeacherStrategy(
      createLearningRecord("math-add-within-10", new Date(0)),
      "use_objects",
      new Date("2026-07-15T10:03:00.000Z"),
    );

    expect(reviewed.reviewState).toBe("approved");
    expect(getParentSummary(reviewed).homePrompt).toContain("spoons");
    expect(getNextActivityMessage(reviewed)).toContain("starts with counters");
  });

  it("never includes a custom prompt in the parent summary or stored schema", () => {
    const record = createLearningRecord("cs-linear-search", new Date(0));
    const summary = JSON.stringify(getParentSummary(record));
    const stored = JSON.stringify(record);

    expect(summary).not.toContain("prompt");
    expect(stored).not.toContain("transcript");
    expect(parseStoredLearningRecord(stored)).toEqual(record);
    expect(parseStoredLearningRecord("not-json")).toBeNull();
  });

  it("keeps a bounded rolling attempt history instead of crashing", () => {
    let record = createLearningRecord("math-add-within-10", new Date(0));

    for (let index = 0; index < 20; index += 1) {
      record = recordAttempt(record, {
        questionId: `question-${index}`,
        selectedOptionId: `option-${index}`,
        correct: false,
      });
    }

    expect(record.attempts).toHaveLength(12);
    expect(record.attempts[0]?.questionId).toBe("question-8");
    expect(record.attempts.at(-1)?.questionId).toBe("question-19");
    expect(record.observation).toBe("try_again");
  });
});
