"use client";

import { ArrowRight, Home, LockKeyhole, MessageCircle } from "lucide-react";

import { useLearningRecord } from "@/components/learning-record-provider";
import { getParentSummary } from "@/lib/learning-record";

export function ParentDashboard() {
  const { record } = useLearningRecord();
  const summary = getParentSummary(record);
  const lessonHref =
    record.lessonId === "math-add-within-10"
      ? "/learn/class-1/add-within-10"
      : "/learn/class-11/linear-search";

  return (
    <main id="main-content" className="page-shell dashboard-page parent-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Parent mode · Same activity record</p>
          <h1>One clear update and one thing to try at home</h1>
          <p>
            This view leaves out learner prompts, model transcripts, ranks, and
            diagnostic labels.
          </p>
        </div>
        <div className="code-mark warm" aria-hidden="true">
          <Home size={32} />
        </div>
      </div>

      <section className="parent-summary-card" aria-labelledby="parent-summary-title">
        <p className="eyebrow">What happened in this activity</p>
        <h2 id="parent-summary-title">The learner worked on {summary.workedOn}.</h2>
        <p className="parent-observation">{summary.activityObservation}</p>
        <div className="review-line">
          <span>Teacher review</span>
          <strong>{record.reviewState.replace("_", " ")}</strong>
        </div>
      </section>

      <section className="home-prompt" aria-labelledby="home-prompt-title">
        <div className="section-icon warm" aria-hidden="true">
          <MessageCircle size={23} />
        </div>
        <div>
          <p className="eyebrow">Try this once at home</p>
          <h2 id="home-prompt-title">A short, teacher-informed prompt</h2>
          <blockquote>{summary.homePrompt}</blockquote>
          <p>
            Keep it conversational. Stop if the learner is tired or does not
            want to continue.
          </p>
        </div>
      </section>

      <aside className="privacy-strip">
        <LockKeyhole size={21} aria-hidden="true" />
        <p>
          The local record contains answer IDs, correctness, hint use, review
          state, and teacher strategy. It does not contain the custom learner
          question.
        </p>
      </aside>

      <a className="button primary" href={lessonHref}>
        See the changed next activity <ArrowRight size={19} aria-hidden="true" />
      </a>
    </main>
  );
}
