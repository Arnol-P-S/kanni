"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Code2,
  Info,
  Search,
  ShieldCheck,
} from "lucide-react";

import { AdultGate } from "@/components/adult-gate";
import { useLearningRecord } from "@/components/learning-record-provider";
import type { TutorResponse } from "@/lib/domain";
import {
  getSection,
  getSource,
  suggestedLinearSearchAnswers,
} from "@/lib/lessons";

function AnswerPanel({ answer }: { answer: TutorResponse }) {
  const sections = answer.sourceSectionIds
    .map((id) => getSection(id))
    .filter((section) => section !== undefined);

  return (
    <section className="answer-panel" aria-live="polite" aria-labelledby="answer-title">
      <div className={`answer-status ${answer.status}`}>
        {answer.status === "grounded" ? (
          <CheckCircle2 size={19} aria-hidden="true" />
        ) : (
          <Info size={19} aria-hidden="true" />
        )}
        {answer.status.replace("_", " ")}
      </div>
      <h2 id="answer-title">Lesson answer</h2>
      <p>{answer.explanation}</p>
      {answer.steps.length ? (
        <ol>
          {answer.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}

      {sections.length ? (
        <div className="source-cards">
          <h3>Grounded lesson sections</h3>
          {sections.map((section) => {
            const source = getSource(section.sourceId);
            return (
              <article key={section.id}>
                <span>{section.id}</span>
                <h4>{section.title.en}</h4>
                <p>{section.text.en}</p>
                <small>
                  {source?.title} · {source?.license}
                </small>
              </article>
            );
          })}
        </div>
      ) : null}

      {answer.deepCheck ? (
        <div className="deep-check-result">
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <h3>Deep Check</h3>
            <p>
              Source critic: <strong>{answer.deepCheck.sourceCritic}</strong> ·
              Teaching and safety critic:{" "}
              <strong>{answer.deepCheck.teachingCritic}</strong>
            </p>
            {answer.deepCheck.issueCodes.length ? (
              <p>Warnings: {answer.deepCheck.issueCodes.join(", ")}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ClassElevenActivity() {
  const { language, beginLesson } = useLearningRecord();
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [deepCheck, setDeepCheck] = useState(false);
  const [answer, setAnswer] = useState<TutorResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function selectSuggested(id: keyof typeof suggestedLinearSearchAnswers) {
    beginLesson("cs-linear-search");
    setAnswer(suggestedLinearSearchAnswers[id]);
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adultConfirmed || !prompt.trim()) return;
    beginLesson("cs-linear-search");
    setSubmitting(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "cs-linear-search",
          language,
          mode: "custom_question",
          prompt,
          deepCheck,
        }),
      });
      if (!response.ok) {
        throw new Error("The supervised question could not be checked.");
      }
      setAnswer((await response.json()) as TutorResponse);
    } catch {
      setAnswer({
        status: "unavailable",
        explanation:
          "AI help is unavailable right now. Choose one of the reviewed questions above to continue.",
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
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="page-shell activity-page class-eleven-page">
      <div className="activity-heading">
        <div>
          <p className="eyebrow">Class 11 · Computer Science</p>
          <h1>Trace linear search, one comparison at a time</h1>
          <p className="activity-intro">
            Start with a reviewed answer. An adult can also test one bounded
            custom question against the same lesson pack.
          </p>
        </div>
        <div className="code-mark" aria-hidden="true">
          <Code2 size={34} />
        </div>
      </div>

      <section className="trace-demo" aria-labelledby="trace-title">
        <div>
          <p className="eyebrow">Worked trace</p>
          <h2 id="trace-title">Find 7 in [4, 7, 9]</h2>
        </div>
        <div className="trace-row" aria-label="Check 4, then find 7 at index 1">
          <span className="trace-cell checked"><small>index 0</small>4<b>not a match</b></span>
          <ChevronRight aria-hidden="true" />
          <span className="trace-cell found"><small>index 1</small>7<b>match, stop</b></span>
          <span className="trace-cell muted"><small>index 2</small>9<b>not checked</b></span>
        </div>
      </section>

      <section className="suggested-section" aria-labelledby="suggested-title">
        <div className="section-heading compact">
          <p className="eyebrow">Works without AI</p>
          <h2 id="suggested-title">Choose a reviewed question</h2>
        </div>
        <div className="suggested-grid">
          <button type="button" onClick={() => selectSuggested("what-is-linear-search")}>
            <Search size={21} aria-hidden="true" />
            <span><strong>What is linear search?</strong><small>Definition and steps</small></span>
            <ChevronRight aria-hidden="true" />
          </button>
          <button type="button" onClick={() => selectSuggested("trace-an-example")}>
            <Code2 size={21} aria-hidden="true" />
            <span><strong>Trace a short example</strong><small>Index, value, and stopping point</small></span>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </section>

      {answer ? <AnswerPanel answer={answer} /> : null}

      <section className="custom-question-section" aria-labelledby="custom-title">
        <div className="section-heading compact">
          <p className="eyebrow">Optional supervised AI</p>
          <h2 id="custom-title">Ask one question about this lesson</h2>
          <p>
            Do not enter a learner name, school, phone number, email address, or
            other personal detail. Kanni does not store this field.
          </p>
        </div>
        {!adultConfirmed ? (
          <AdultGate onConfirmed={() => setAdultConfirmed(true)} />
        ) : (
          <form onSubmit={submitQuestion} className="custom-question-form">
            <label htmlFor="custom-question">Custom lesson question</label>
            <textarea
              id="custom-question"
              value={prompt}
              maxLength={400}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="For example: Why does linear search stop after a match?"
              rows={4}
            />
            <div className="form-meta">
              <span>{prompt.length} / 400 characters</span>
              <label className="check-row compact-check">
                <input
                  type="checkbox"
                  checked={deepCheck}
                  onChange={(event) => setDeepCheck(event.target.checked)}
                />
                <span>Run optional Deep Check</span>
              </label>
            </div>
            <button className="button primary" type="submit" disabled={!prompt.trim() || submitting}>
              {submitting ? "Checking the lesson…" : "Ask within this lesson"}
            </button>
          </form>
        )}
      </section>

      <aside className="plain-note">
        <Info size={20} aria-hidden="true" />
        <p>
          Deep Check runs two bounded critics. A pass is a format and grounding
          check, not proof that the answer is always correct.
        </p>
      </aside>
    </main>
  );
}
