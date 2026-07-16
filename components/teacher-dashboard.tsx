"use client";

import { CheckCircle2, ClipboardCheck, Info, RefreshCcw } from "lucide-react";

import { useLearningRecord } from "@/components/learning-record-provider";
import type { TeacherStrategy } from "@/lib/domain";

const observationCopy = {
  not_assessed: "No check has been completed in this activity.",
  correct_first_try: "The recorded answers in this activity were correct without a hint.",
  correct_after_hint:
    "The initial answer was incorrect, a hint was used, and the follow-up answer was correct.",
  try_again:
    "The latest response in this activity was incorrect and is ready for another try.",
} as const;

const strategyLabels: Record<TeacherStrategy, string> = {
  use_objects: "Use objects",
  use_number_line: "Use a number line",
  use_smaller_numbers: "Try smaller numbers",
  use_trace_table: "Use a trace table",
  show_worked_example: "Show a worked example",
  ask_learner_to_explain: "Ask the learner to explain",
};

export function TeacherDashboard() {
  const {
    record,
    chooseStrategy,
    updateReviewState,
    resetDemo,
  } = useLearningRecord();
  const strategies: TeacherStrategy[] =
    record.lessonId === "math-add-within-10"
      ? ["use_objects", "use_number_line", "use_smaller_numbers"]
      : [
          "use_trace_table",
          "show_worked_example",
          "ask_learner_to_explain",
        ];
  const lessonName =
    record.lessonId === "math-add-within-10"
      ? "Class 1 · Addition within 10"
      : "Class 11 · Linear search";

  return (
    <main id="main-content" className="page-shell dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Teacher mode · Synthetic learner</p>
          <h1>Review one activity, then choose one next strategy</h1>
          <p>
            These are activity observations, not diagnoses or claims about the
            learner’s ability.
          </p>
        </div>
        <button className="button quiet" type="button" onClick={resetDemo}>
          <RefreshCcw size={18} aria-hidden="true" /> Reset demo record
        </button>
      </div>

      <section className="record-summary" aria-labelledby="record-title">
        <div className="record-title-row">
          <div className="section-icon" aria-hidden="true">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <p className="eyebrow">In this activity</p>
            <h2 id="record-title">{lessonName}</h2>
          </div>
          <span className={`review-badge ${record.reviewState}`}>
            {record.reviewState.replace("_", " ")}
          </span>
        </div>

        <div className="metric-grid">
          <div>
            <span>Pre-check</span>
            <strong>
              {record.attempts[0]
                ? record.attempts[0].correct
                  ? "Correct"
                  : "Try again"
                : "Not completed"}
            </strong>
          </div>
          <div>
            <span>Follow-up check</span>
            <strong>
              {record.attempts[1]
                ? record.attempts[record.attempts.length - 1].correct
                  ? "Correct"
                  : "Try again"
                : "Not completed"}
            </strong>
          </div>
          <div>
            <span>Attempts</span>
            <strong>{record.attempts.length}</strong>
          </div>
          <div>
            <span>Hint used</span>
            <strong>{record.hintUsed ? "Yes" : "No"}</strong>
          </div>
        </div>

        <div className="observation-box">
          <Info size={21} aria-hidden="true" />
          <div>
            <h3>In this activity</h3>
            <p>{observationCopy[record.observation]}</p>
            {record.possibleConfusionCode ? (
              <p>
                This response may show confusion about counting or tracking the
                next comparison. Review the work before deciding.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="strategy-section" aria-labelledby="strategy-title">
        <div className="section-heading compact">
          <p className="eyebrow">Bounded teacher decision</p>
          <h2 id="strategy-title">Choose the next teaching strategy</h2>
          <p>
            Selecting a strategy approves the record and changes the learner’s
            next activity on this device.
          </p>
        </div>
        <div className="strategy-grid">
          {strategies.map((strategy) => (
            <button
              type="button"
              key={strategy}
              aria-pressed={record.teacherStrategy === strategy}
              onClick={() => chooseStrategy(strategy)}
            >
              {record.teacherStrategy === strategy ? (
                <CheckCircle2 size={22} aria-hidden="true" />
              ) : (
                <span className="empty-check" aria-hidden="true" />
              )}
              <span>
                <strong>{strategyLabels[strategy]}</strong>
                <small>Use in the next learner and home activity</small>
              </span>
            </button>
          ))}
        </div>
        <div className="review-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => updateReviewState("corrected")}
          >
            Mark wording corrected
          </button>
          <a className="button primary" href="/parent">
            See parent handoff
          </a>
        </div>
      </section>
    </main>
  );
}
