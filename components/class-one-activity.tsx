"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Info, Sparkles } from "lucide-react";

import { AdultGate } from "@/components/adult-gate";
import { ReadAloud } from "@/components/read-aloud";
import { useLearningRecord } from "@/components/learning-record-provider";
import type { TutorResponse } from "@/lib/domain";
import { getNextActivityMessage } from "@/lib/learning-record";

type Stage = "pre" | "hint" | "post" | "done";

const copy = {
  ml: {
    eyebrow: "ക്ലാസ് 1 · ഗണിതം",
    title: "കൂട്ടി നോക്കാം",
    intro: "ഒരു മുതിർന്നയാളോടൊപ്പം വൃത്തങ്ങൾ എണ്ണൂ. ശരിയായ ഉത്തരം തൊടൂ.",
    preQuestion: "രണ്ട് വൃത്തങ്ങളും മൂന്ന് വൃത്തങ്ങളും ചേർന്നാൽ ആകെ എത്ര?",
    postQuestion: "ഇനി നോക്കൂ: നാല് വൃത്തങ്ങളും രണ്ട് വൃത്തങ്ങളും ചേർന്നാൽ ആകെ എത്ര?",
    tryAgain: "ഒന്നുകൂടി നോക്കാം.",
    staticHint: "ആദ്യം രണ്ട് വൃത്തങ്ങൾ എണ്ണൂ. പിന്നെ മൂന്ന് വൃത്തങ്ങൾ കൂടി ചേർത്ത് എല്ലാം ഒരിക്കൽ കൂടി എണ്ണൂ.",
    continue: "അടുത്ത ചോദ്യം",
    success: "നന്നായി പരിശോധിച്ചു. തുടർ ഉത്തരം ശരിയാണ്.",
  },
  en: {
    eyebrow: "Class 1 · Mathematics",
    title: "Let’s add",
    intro: "Count the circles with an adult. Touch the correct answer.",
    preQuestion: "How many circles are there when two and three are joined?",
    postQuestion: "Now try: how many circles are there when four and two are joined?",
    tryAgain: "Let’s look once more.",
    staticHint: "Count two circles first. Join three more, then count every circle once.",
    continue: "Next question",
    success: "You checked carefully. The follow-up answer is correct.",
  },
} as const;

function Counters({ groups }: { groups: number[] }) {
  return (
    <div
      className="counter-groups"
      role="img"
      aria-label={`${groups.join(" plus ")} counters`}
    >
      {groups.map((count, groupIndex) => (
        <div className="counter-group" key={`group-${count}-${groupIndex}`}>
          {Array.from({ length: count }, (_, index) => (
            <span key={`counter-${groupIndex}-${index + 1}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ClassOneActivity() {
  const { language, record, beginLesson, addAttempt } = useLearningRecord();
  const [stage, setStage] = useState<Stage>("pre");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [aiHint, setAiHint] = useState<TutorResponse | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const text = copy[language];
  const nextActivity = getNextActivityMessage(record);

  function choosePreAnswer(selectedOptionId: string) {
    beginLesson("math-add-within-10");
    const correct = selectedOptionId === "pre-5";
    addAttempt(
      { questionId: "math-pre-1", selectedOptionId, correct },
      {
        hintUsed: !correct,
        possibleConfusionCode: correct ? null : "needs_counting_support",
      },
    );
    setFeedback(correct ? null : text.tryAgain);
    setStage(correct ? "post" : "hint");
  }

  function choosePostAnswer(selectedOptionId: string) {
    const correct = selectedOptionId === "post-6";
    addAttempt(
      { questionId: "math-post-1", selectedOptionId, correct },
      {
        hintUsed: stage === "hint" || record.hintUsed,
        possibleConfusionCode: correct ? null : "needs_counting_support",
      },
    );
    if (correct) {
      setFeedback(text.success);
      setStage("done");
    } else {
      setFeedback(text.tryAgain);
    }
  }

  async function requestAiHint() {
    setLoadingHint(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "math-add-within-10",
          language,
          mode: "guided_hint",
          selectedAnswerId: "incorrect-pre-check",
          teacherStrategy: record.teacherStrategy ?? undefined,
          deepCheck: false,
        }),
      });
      if (!response.ok) throw new Error("AI hint unavailable");
      setAiHint((await response.json()) as TutorResponse);
    } catch {
      setAiHint({
        status: "unavailable",
        explanation: text.staticHint,
        steps: [],
        hint: text.staticHint,
        recommendedCheckId: null,
        sourceSectionIds: ["math-add-objects"],
        possibleConfusionCode: null,
        trust: {
          sourceMatched: true,
          citationIdsValid: true,
          ageFormatChecked: true,
          safetyRoute: "clear",
          humanReview: "completed",
        },
        deepCheck: null,
      });
    } finally {
      setLoadingHint(false);
    }
  }

  const questionText = stage === "pre" ? text.preQuestion : text.postQuestion;
  const options = stage === "pre" ? [4, 5, 6] : [5, 6, 7];

  return (
    <main id="main-content" className="page-shell activity-page class-one-page">
      <div className="activity-heading">
        <div>
          <p className="eyebrow" lang={language}>{text.eyebrow}</p>
          <h1 lang={language}>{text.title}</h1>
          <p className="activity-intro" lang={language}>{text.intro}</p>
        </div>
        <span className="preview-pill">Malayalam preview · Adult assisted</span>
      </div>

      {nextActivity && record.lessonId === "math-add-within-10" ? (
        <aside className="strategy-banner" aria-label="Teacher-selected next activity">
          <Sparkles size={22} aria-hidden="true" />
          <div>
            <strong>Teacher choice applied</strong>
            <p>{nextActivity}</p>
          </div>
        </aside>
      ) : null}

      <section className="activity-card" aria-live="polite">
        {stage === "done" ? (
          <div className="success-state">
            <CheckCircle2 size={52} aria-hidden="true" />
            <h2 lang={language}>{text.success}</h2>
            <p>
              The teacher and parent views now use this same activity record.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="/teacher">
                Open teacher view <ArrowRight size={18} aria-hidden="true" />
              </a>
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setStage("pre");
                  setFeedback(null);
                  setAiHint(null);
                }}
              >
                Try again
              </button>
            </div>
          </div>
        ) : stage === "hint" ? (
          <div className="hint-state">
            <p className="feedback-label" lang={language}>{feedback}</p>
            <Counters groups={[2, 3]} />
            <h2 lang={language}>{text.staticHint}</h2>
            <ReadAloud text={text.staticHint} language={language} />
            {adultConfirmed ? (
              <div className="ai-hint-panel">
                {aiHint ? (
                  <p lang={language}>
                    <strong>Supervised AI hint:</strong>{" "}
                    {aiHint.hint || aiHint.explanation}
                  </p>
                ) : (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={requestAiHint}
                    disabled={loadingHint}
                  >
                    {loadingHint ? "Checking…" : "Ask for another grounded hint"}
                  </button>
                )}
              </div>
            ) : null}
            <button
              className="button primary learner-button"
              type="button"
              onClick={() => {
                setStage("post");
                setFeedback(null);
              }}
              lang={language}
            >
              {text.continue} <ArrowRight size={22} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="question-state">
            <div className="question-toolbar">
              <span>{stage === "pre" ? "1 / 2" : "2 / 2"}</span>
              <ReadAloud text={questionText} language={language} />
            </div>
            <Counters groups={stage === "pre" ? [2, 3] : [4, 2]} />
            <h2 lang={language}>{questionText}</h2>
            {feedback ? <p className="inline-error">{feedback}</p> : null}
            <div className="answer-grid" aria-label="Answer choices">
              {options.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() =>
                    stage === "pre"
                      ? choosePreAnswer(`pre-${option}`)
                      : choosePostAnswer(`post-${option}`)
                  }
                  aria-label={`Answer ${option}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {!adultConfirmed ? (
        <AdultGate onConfirmed={() => setAdultConfirmed(true)} />
      ) : (
        <p className="confirmation-note">
          <CheckCircle2 size={18} aria-hidden="true" /> Adult-supervised AI is
          available for this browser session.
        </p>
      )}

      <aside className="plain-note">
        <Info size={20} aria-hidden="true" />
        <p>
          No free-text response, timer, streak, rank, or learner name is used in
          this Class 1 activity.
        </p>
      </aside>
    </main>
  );
}
