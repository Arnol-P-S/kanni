"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Info, Sparkles } from "lucide-react";

import { AdultGate } from "@/components/adult-gate";
import { ReadAloud } from "@/components/read-aloud";
import { useLearningRecord } from "@/components/learning-record-provider";
import {
  TutorResponseSchema,
  type GuidedAnswerId,
  type TutorResponse,
} from "@/lib/domain";
import { getNextActivityMessage } from "@/lib/learning-record";
import {
  getNextMathActivity,
  type GuidedOption,
  type GuidedVisual,
} from "@/lib/math-activity-strategies";

type Stage = "pre" | "hint" | "post" | "done";

const copy = {
  ml: {
    eyebrow: "ക്ലാസ് 1 · ഗണിതം",
    title: "കൂട്ടി നോക്കാം",
    intro: "ഒരു മുതിർന്നയാളോടൊപ്പം വൃത്തങ്ങൾ എണ്ണൂ. ശരിയായ ഉത്തരം തൊടൂ.",
    postQuestion: "ഇനി നോക്കൂ: നാല് വൃത്തങ്ങളും രണ്ട് വൃത്തങ്ങളും ചേർന്നാൽ ആകെ എത്ര?",
    tryAgain: "ഒന്നുകൂടി നോക്കാം.",
    continue: "അടുത്ത ചോദ്യം",
    success: "നന്നായി പരിശോധിച്ചു. തുടർ ഉത്തരം ശരിയാണ്.",
  },
  en: {
    eyebrow: "Class 1 · Mathematics",
    title: "Let’s add",
    intro: "Count the circles with an adult. Touch the correct answer.",
    postQuestion: "Now try: how many circles are there when four and two are joined?",
    tryAgain: "Let’s look once more.",
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

function NumberLine({
  visual,
}: {
  visual: Extract<GuidedVisual, { type: "number_line" }>;
}) {
  return (
    <div
      className="number-line"
      role="img"
      aria-label={`Number line from 0 to 10. Start at ${visual.start}, make ${visual.jumps} forward jumps, and stop at ${visual.end}.`}
    >
      <div className="number-line-jumps" aria-hidden="true">
        {Array.from({ length: visual.jumps }, (_, index) => (
          <span key={`jump-${index + 1}`}>+1</span>
        ))}
      </div>
      <div className="number-line-track" aria-hidden="true">
        {Array.from({ length: 11 }, (_, value) => (
          <span
            className={
              value === visual.start
                ? "start"
                : value === visual.end
                  ? "end"
                  : undefined
            }
            key={value}
          >
            <b>{value}</b>
            {value === visual.start ? <small>start</small> : null}
            {value === visual.end ? <small>land</small> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function GuidedVisualCard({ visual }: { visual: GuidedVisual }) {
  return visual.type === "number_line" ? (
    <NumberLine visual={visual} />
  ) : (
    <Counters groups={visual.groups} />
  );
}

export function ClassOneActivity() {
  const { language, record, beginLesson, addAttempt } = useLearningRecord();
  const [stage, setStage] = useState<Stage>("pre");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [aiHint, setAiHint] = useState<TutorResponse | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [selectedPreAnswerId, setSelectedPreAnswerId] =
    useState<GuidedAnswerId | null>(null);
  const text = copy[language];
  const nextActivity = getNextActivityMessage(record);
  const guidedActivity = getNextMathActivity(
    record.lessonId === "math-add-within-10"
      ? record.teacherStrategy
      : null,
  );

  function choosePreAnswer(option: GuidedOption) {
    beginLesson("math-add-within-10");
    addAttempt(
      {
        questionId: guidedActivity.id,
        selectedOptionId: option.id,
        correct: option.correct,
      },
      {
        hintUsed: !option.correct,
        possibleConfusionCode: option.correct
          ? null
          : "needs_counting_support",
      },
    );
    setSelectedPreAnswerId(option.correct ? null : option.id);
    setFeedback(option.correct ? null : text.tryAgain);
    setStage(option.correct ? "post" : "hint");
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
    if (!selectedPreAnswerId) return;
    setLoadingHint(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "math-add-within-10",
          language,
          mode: "guided_hint",
          questionId: guidedActivity.id,
          selectedAnswerId: selectedPreAnswerId,
          deepCheck: false,
        }),
      });
      if (!response.ok) throw new Error("AI hint unavailable");
      setAiHint(TutorResponseSchema.parse(await response.json()));
    } catch {
      setAiHint({
        status: "unavailable",
        explanation: guidedActivity.fixedHint[language],
        steps: [],
        hint: guidedActivity.fixedHint[language],
        recommendedCheckId: null,
        sourceSectionIds: [guidedActivity.focusSectionId],
        possibleConfusionCode: null,
        trust: {
          sourceMatched: true,
          citationIdsValid: true,
          ageFormatChecked: true,
          safetyRoute: "clear",
          contentOrigin: "project_authored",
        },
        deepCheck: null,
      });
    } finally {
      setLoadingHint(false);
    }
  }

  const questionText =
    stage === "pre" ? guidedActivity.question[language] : text.postQuestion;

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
                  setSelectedPreAnswerId(null);
                }}
              >
                Try again
              </button>
            </div>
          </div>
        ) : stage === "hint" ? (
          <div className="hint-state">
            <p className="feedback-label" lang={language}>{feedback}</p>
            <GuidedVisualCard visual={guidedActivity.visual} />
            <h2 lang={language}>{guidedActivity.fixedHint[language]}</h2>
            <ReadAloud text={guidedActivity.fixedHint[language]} language={language} />
            {adultConfirmed ? (
              <div className="ai-hint-panel">
                {aiHint ? (
                  <>
                    <p lang={language}>
                      <strong>Supervised AI hint:</strong>{" "}
                      {aiHint.hint || aiHint.explanation}
                    </p>
                    {aiHint.status === "grounded" ? (
                      <p className="ai-caution">
                        AI can be wrong. Check this hint with the supervising
                        adult or teacher.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={requestAiHint}
                    disabled={loadingHint}
                  >
                    {loadingHint ? "Checking…" : "Ask for another supervised hint"}
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
            {stage === "pre" ? (
              <GuidedVisualCard visual={guidedActivity.visual} />
            ) : (
              <Counters groups={[4, 2]} />
            )}
            <h2 lang={language}>{questionText}</h2>
            {feedback ? <p className="inline-error">{feedback}</p> : null}
            <div className="answer-grid" aria-label="Answer choices">
              {stage === "pre"
                ? guidedActivity.options.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => choosePreAnswer(option)}
                      aria-label={`Answer ${option.value}`}
                    >
                      {option.value}
                    </button>
                  ))
                : [5, 6, 7].map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => choosePostAnswer(`post-${option}`)}
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
