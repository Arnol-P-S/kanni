import {
  LearningRecordSchema,
  type Attempt,
  type LearningRecord,
  type ReviewState,
  type TeacherStrategy,
} from "@/lib/domain";

export const STORAGE_KEY = "kanni.learning-record.v1";

export function createLearningRecord(
  lessonId: LearningRecord["lessonId"] = "math-add-within-10",
  now = new Date(),
): LearningRecord {
  return {
    attemptId: `demo-${now.getTime()}`,
    profileId:
      lessonId === "math-add-within-10"
        ? "demo-class-1"
        : "demo-class-11",
    lessonId,
    attempts: [],
    observation: "not_assessed",
    hintUsed: false,
    possibleConfusionCode: null,
    reviewState: "pending_review",
    teacherStrategy: null,
    updatedAt: now.toISOString(),
  };
}

export function parseStoredLearningRecord(
  rawValue: string | null,
): LearningRecord | null {
  if (!rawValue) return null;
  try {
    const parsed: unknown = JSON.parse(rawValue);
    return LearningRecordSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function recordAttempt(
  record: LearningRecord,
  attempt: Attempt,
  options: {
    hintUsed?: boolean;
    possibleConfusionCode?: string | null;
    now?: Date;
  } = {},
): LearningRecord {
  const attempts = [...record.attempts, attempt];
  const hintUsed = record.hintUsed || Boolean(options.hintUsed);
  const hasIncorrectAttempt = attempts.some((item) => !item.correct);
  const observation = attempt.correct
    ? hasIncorrectAttempt || hintUsed
      ? "correct_after_hint"
      : "correct_first_try"
    : "try_again";

  return LearningRecordSchema.parse({
    ...record,
    attempts,
    observation,
    hintUsed,
    possibleConfusionCode:
      options.possibleConfusionCode ?? record.possibleConfusionCode,
    reviewState: "pending_review",
    updatedAt: (options.now ?? new Date()).toISOString(),
  });
}

export function selectTeacherStrategy(
  record: LearningRecord,
  strategy: TeacherStrategy,
  now = new Date(),
): LearningRecord {
  return LearningRecordSchema.parse({
    ...record,
    teacherStrategy: strategy,
    reviewState: "approved",
    updatedAt: now.toISOString(),
  });
}

export function setReviewState(
  record: LearningRecord,
  reviewState: ReviewState,
  now = new Date(),
): LearningRecord {
  return LearningRecordSchema.parse({
    ...record,
    reviewState,
    updatedAt: now.toISOString(),
  });
}

const strategyHomePrompts: Record<TeacherStrategy, string> = {
  use_objects:
    "Place two spoons beside three spoons. Ask the learner to join the groups and count each spoon once.",
  use_number_line:
    "Draw 0 to 10. Start at 4 and make two jumps forward together.",
  use_smaller_numbers:
    "Use one fruit and two cups. Ask how many objects there are altogether.",
  use_trace_table:
    "Write [3, 8, 5] and target 5. Ask which item is checked at each step.",
  show_worked_example:
    "Work through one short search example, then ask the learner to explain where the search stops.",
  ask_learner_to_explain:
    "Ask the learner to explain why a search must report not found after the final item.",
};

export function getParentSummary(record: LearningRecord): {
  workedOn: string;
  activityObservation: string;
  homePrompt: string;
} {
  const workedOn =
    record.lessonId === "math-add-within-10"
      ? "joining two small groups and finding the total within 10"
      : "tracing how linear search checks a list";

  const activityObservation: Record<LearningRecord["observation"], string> = {
    not_assessed: "No answer has been recorded in this activity yet.",
    correct_first_try: "The first answer in this activity was correct.",
    correct_after_hint:
      "The first answer needed another look, a hint was used, and the follow-up answer was correct.",
    try_again:
      "The answer in this activity needs another try. This is an activity result, not a judgement about the learner.",
  };

  return {
    workedOn,
    activityObservation: activityObservation[record.observation],
    homePrompt: record.teacherStrategy
      ? strategyHomePrompts[record.teacherStrategy]
      : "Ask the learner to show one example from the activity and explain one step in their own words.",
  };
}

export function getNextActivityMessage(record: LearningRecord): string | null {
  if (!record.teacherStrategy) return null;
  const messages: Record<TeacherStrategy, string> = {
    use_objects: "Your teacher chose objects. The next question starts with counters.",
    use_number_line:
      "Your teacher chose a number line. The next question starts with forward jumps.",
    use_smaller_numbers:
      "Your teacher chose smaller numbers. The next question starts with 1 + 2.",
    use_trace_table:
      "Your teacher chose a trace table. The next search will show each comparison.",
    show_worked_example:
      "Your teacher chose a worked example. The next activity begins with one complete trace.",
    ask_learner_to_explain:
      "Your teacher chose learner explanation. The next activity asks you to explain the stopping point.",
  };
  return messages[record.teacherStrategy];
}

export function canIngestSource(input: {
  usage: "ingested" | "link_only";
  rightsBasis:
    | "original"
    | "cc_by_4_0"
    | "public_domain"
    | "written_permission"
    | "unknown";
}): boolean {
  return (
    input.usage === "ingested" &&
    input.rightsBasis !== "unknown"
  );
}
