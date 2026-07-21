"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Eye, Lightbulb, PenTool, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import {
  requestStudentThinkingHelpAction,
  submitLearnerWorkAction,
  type StudentHelpActionState,
} from "@/app/actions/studio";
import type { StudentThinkingCoach, TeacherPlan } from "@/lib/studio/contracts";
import { promptsForScaffold, type ScaffoldLevelValue } from "@/lib/studio/workflow";

function SubmitWorkButton() {
  const { pending } = useFormStatus();
  return <button className="button primary" type="submit" disabled={pending}><Send aria-hidden="true" />{pending ? "Sending work…" : "Send my work to the teacher"}</button>;
}

export function StudentStudioForm({
  studioId,
  plan,
  scaffoldLevel,
  aiAvailable,
  aiModel,
  studentHelpStatus,
  initialStudentHelp,
}: {
  studioId: string;
  plan: TeacherPlan;
  scaffoldLevel: ScaffoldLevelValue;
  aiAvailable: boolean;
  aiModel: string;
  studentHelpStatus: "not_requested" | "ready" | "unavailable" | "rejected";
  initialStudentHelp: StudentThinkingCoach | null;
}) {
  const [step, setStep] = useState(1);
  const [supportOpened, setSupportOpened] = useState(Boolean(initialStudentHelp));
  const [firstDraft, setFirstDraft] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [studentHelp, setStudentHelp] = useState(initialStudentHelp);
  const [helpResult, setHelpResult] = useState<StudentHelpActionState | null>(null);
  const [helpAttempted, setHelpAttempted] = useState(false);
  const [helpPending, startHelpTransition] = useTransition();
  const hasMoved = useRef(false);
  const prompts = promptsForScaffold(plan, scaffoldLevel);
  const firstAttemptReady = firstDraft.trim().length >= 60;

  useEffect(() => {
    if (!hasMoved.current) return;
    const headingIds = [
      "student-step-one-title",
      "student-step-two-title",
      "student-step-three-title",
      "student-step-four-title",
      "student-step-five-title",
    ];
    document.getElementById(headingIds[step - 1])?.focus();
  }, [step]);

  function move(next: number) {
    const form = document.getElementById("learner-studio-form") as HTMLFormElement | null;
    if (next > step && form && !form.reportValidity()) return;
    hasMoved.current = true;
    setStep(next);
  }

  function requestCreativeHelp() {
    const formData = new FormData();
    formData.set("studioId", studioId);
    formData.set("firstDraft", firstDraft);
    formData.set("adultSupervisionConfirmed", adultConfirmed ? "yes" : "");
    startHelpTransition(async () => {
      const result = await requestStudentThinkingHelpAction(formData);
      setHelpResult(result);
      if (result.status === "success" || result.status === "unavailable") {
        setHelpAttempted(true);
      }
      if (result.help) {
        setStudentHelp(result.help);
        setSupportOpened(true);
      }
    });
  }

  const helpAlreadyClaimed =
    studentHelpStatus !== "not_requested" || Boolean(studentHelp) || helpAttempted;

  return (
    <form id="learner-studio-form" action={submitLearnerWorkAction} className="student-studio-form">
      <input type="hidden" name="studioId" value={studioId} />
      <input type="hidden" name="supportOpened" value={String(supportOpened)} />
      <div className="student-step-progress" aria-label="Activity progress">
        {[
          "Choose and predict",
          "Make a first version",
          "Critique it",
          "Revise and explain",
          "Reflect and send",
        ].map((label, index) => <div key={label} data-active={step === index + 1} data-complete={step > index + 1}><span>{step > index + 1 ? <CheckCircle2 aria-hidden="true" /> : index + 1}</span><small>{label}</small></div>)}
      </div>

      <section hidden={step !== 1} className="student-work-step" aria-labelledby="student-step-one-title">
        <p className="step-kicker">Step 1 of 5</p><h2 id="student-step-one-title" tabIndex={-1}>Choose a route and make a prediction</h2><p>You decide how to enter the problem. Kanni will not choose an interest or answer for you.</p>
        <fieldset className="student-choice-grid"><legend>Choose an interest route</legend>{plan.interestHooks.map((hook, index) => <label key={hook.title}><input type="radio" name="interestHookIndex" value={index} required={step === 1} /><span><strong>{hook.title}</strong><small>{hook.prompt}</small></span></label>)}</fieldset>
        <fieldset className="student-choice-grid maker-choice-grid"><legend>Choose what you want to make</legend>{plan.makerChoices.map((choice) => <label key={choice.id}><input type="radio" name="makerChoiceId" value={choice.id} required={step === 1} /><span><PenTool aria-hidden="true" /><strong>{choice.title}</strong><small>{choice.prompt}</small><ul>{choice.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul></span></label>)}</fieldset>
        <label htmlFor="prediction">What do you predict before you begin?</label><textarea id="prediction" name="prediction" rows={4} minLength={20} maxLength={800} required={step === 1} />
        <div className="builder-actions"><span /><button className="button primary" type="button" onClick={() => move(2)}>Start making<ArrowRight aria-hidden="true" /></button></div>
      </section>

      <section hidden={step !== 2} className="student-work-step" aria-labelledby="student-step-two-title">
        <p className="step-kicker">Step 2 of 5</p><h2 id="student-step-two-title" tabIndex={-1}>Make a first version before opening support</h2><p>Describe what you built, drew, tested, or explained. A rough first version gives you something real to improve.</p>
        <label htmlFor="firstDraft">My first version</label><textarea id="firstDraft" name="firstDraft" rows={8} minLength={60} maxLength={2000} value={firstDraft} onChange={(event) => setFirstDraft(event.target.value)} required={step === 2} />
        <div className="scaffold-panel" data-level={scaffoldLevel}>
          <div><Lightbulb aria-hidden="true" /><span><strong>{scaffoldLevel === "guided" ? "Guided questions are available" : scaffoldLevel === "light" ? "One light prompt is available" : "Independent start"}</strong><small id="support-gate-note">{scaffoldLevel === "independent" ? "Your teacher has removed the planned prompts for this cycle. The curriculum source remains available above." : firstAttemptReady ? "Your first version is ready. Open support only if you need it." : "Finish a first version before opening support. The prompts should respond to your thinking, not replace it."}</small></span></div>
          {prompts.length > 0 && !supportOpened ? <button className="button secondary" type="button" aria-describedby="support-gate-note" disabled={!firstAttemptReady} onClick={() => setSupportOpened(true)}><Eye aria-hidden="true" />Open thinking support</button> : null}
          {supportOpened ? <ol className="socratic-support-list">{prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol> : null}
        </div>
        <div className="ai-thinking-coach" data-status={studentHelp ? "ready" : studentHelpStatus}>
          <div className="ai-thinking-heading"><Sparkles aria-hidden="true" /><span><strong>Creative thinking coach</strong><small>Optional, one use per studio, and grounded only in your first attempt plus relevant curriculum sections.</small></span></div>
          <div className="student-ai-boundary"><ShieldCheck aria-hidden="true" /><p><strong>Your work stays yours.</strong> AI gives questions and small experiments, not a finished answer or something to copy. Your name, account, family data, and later submission fields are not added.</p></div>
          {!studentHelp ? (
            <div className="student-ai-request">
              <label className="student-ai-confirmation"><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} disabled={!aiAvailable || helpAlreadyClaimed} /><span>I am 18 or older and I am testing this myself or supervising this activity.</span></label>
              <button className="button ai-button" type="button" onClick={requestCreativeHelp} disabled={!firstAttemptReady || !adultConfirmed || !aiAvailable || helpPending || helpAlreadyClaimed}><Sparkles aria-hidden="true" />{helpPending ? "Building creative steps…" : helpAlreadyClaimed ? "Thinking-coach request used" : "Give me creative next steps"}</button>
              <small>{!firstAttemptReady ? "Write your own first attempt first." : !aiAvailable ? "AI is off. The teacher-reviewed prompts above still work." : !adultConfirmed ? "An adult must confirm supervision before Kanni sends this request." : helpAlreadyClaimed ? "Kanni allows one request so support stays intentional and cost stays bounded." : `This sends your first attempt and up to four retrieved source sections to ${aiModel}.`}</small>
            </div>
          ) : (
            <div className="student-help-result" aria-label="Creative next steps">
              <p>{studentHelp.opening}</p>
              <ol>{studentHelp.creativeSteps.map((creativeStep) => <li key={`${creativeStep.title}-${creativeStep.question}`}><span>{creativeStep.title}</span><strong>{creativeStep.question}</strong><p>{creativeStep.tryThis}</p><small>Source: {creativeStep.sourceSectionIds.join(", ")}</small></li>)}</ol>
              <div className="student-help-self-check"><strong>Check it yourself</strong><p>{studentHelp.selfCheck}</p></div>
              <small className="student-help-grounding">Grounded in {studentHelp.sourceSectionIds.join(", ")}. No final answer was requested.</small>
            </div>
          )}
          {helpResult ? <p className={helpResult.status === "success" ? "form-success" : "form-error"} role={helpResult.status === "success" ? "status" : "alert"}>{helpResult.message}</p> : null}
        </div>
        <div className="builder-actions"><button className="button quiet" type="button" onClick={() => move(1)}><ArrowLeft aria-hidden="true" />Back</button><button className="button primary" type="button" onClick={() => move(3)}>Critique my version<ArrowRight aria-hidden="true" /></button></div>
      </section>

      <section hidden={step !== 3} className="student-work-step" aria-labelledby="student-step-three-title">
        <p className="step-kicker">Step 3 of 5</p><h2 id="student-step-three-title" tabIndex={-1}>Find the weakness yourself</h2><p>Do not wait for a score. Compare your first version with the source and name one change that would make it more convincing.</p>
        <label htmlFor="selfCritique">My critique</label><textarea id="selfCritique" name="selfCritique" rows={6} minLength={25} maxLength={900} placeholder="The evidence is not clear yet because…" required={step === 3} />
        <div className="critique-prompts"><strong>Try one of these checks</strong><ul><li>What claim did I make?</li><li>Which source detail supports it?</li><li>What would someone challenge?</li><li>Did my test actually answer the driving question?</li></ul></div>
        <div className="builder-actions"><button className="button quiet" type="button" onClick={() => move(2)}><ArrowLeft aria-hidden="true" />Back</button><button className="button primary" type="button" onClick={() => move(4)}>Revise it<ArrowRight aria-hidden="true" /></button></div>
      </section>

      <section hidden={step !== 4} className="student-work-step" aria-labelledby="student-step-four-title">
        <p className="step-kicker">Step 4 of 5</p><h2 id="student-step-four-title" tabIndex={-1}>Revise, then explain the reason</h2>
        <label htmlFor="revision">My revised version</label><textarea id="revision" name="revision" rows={8} minLength={60} maxLength={2000} required={step === 4} />
        <label htmlFor="explanation">Why is this version stronger?</label><textarea id="explanation" name="explanation" rows={5} minLength={40} maxLength={1200} placeholder="I changed… because the source or my test showed…" required={step === 4} />
        <div className="builder-actions"><button className="button quiet" type="button" onClick={() => move(3)}><ArrowLeft aria-hidden="true" />Back</button><button className="button primary" type="button" onClick={() => move(5)}>Reflect on my process<ArrowRight aria-hidden="true" /></button></div>
      </section>

      <section hidden={step !== 5} className="student-work-step" aria-labelledby="student-step-five-title">
        <p className="step-kicker">Step 5 of 5</p><h2 id="student-step-five-title" tabIndex={-1}>Name what you can now do yourself</h2>
        <div className="reflection-question-list">{plan.reflectionPrompts.map((prompt) => <p key={prompt}>{prompt}</p>)}</div>
        <label htmlFor="reflection">My reflection</label><textarea id="reflection" name="reflection" rows={6} minLength={20} maxLength={700} required={step === 5} />
        <div className="submission-summary"><CheckCircle2 aria-hidden="true" /><span><strong>Your teacher will see your work in order.</strong><small>Prediction, first version, critique, revision, explanation, reflection, and whether you opened support.</small></span></div>
        <div className="builder-actions"><button className="button quiet" type="button" onClick={() => move(4)}><ArrowLeft aria-hidden="true" />Back</button><SubmitWorkButton /></div>
      </section>
    </form>
  );
}
