"use client";

import { ArrowRight, BookOpenCheck, Save, UserRoundCheck } from "lucide-react";
import { useState } from "react";

import {
  publishLearningStudioAction,
  saveTeacherPlanAction,
} from "@/app/actions/studio";
import type { TeacherPlan } from "@/lib/studio/contracts";

function SourceBadges({ ids }: { ids: string[] }) {
  return <span className="source-badges" aria-label={`Sources ${ids.join(", ")}`}>{ids.map((id) => <span key={id}>{id}</span>)}</span>;
}

function ListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (index: number, value: string) => void;
}) {
  return <div className="editable-list"><h4>{label}</h4>{values.map((value, index) => <label key={`${label}-${index}`}><span>{index + 1}</span><textarea aria-label={`${label} ${index + 1}`} value={value} onChange={(event) => onChange(index, event.target.value)} rows={2} /></label>)}</div>;
}

export function TeacherPlanEditor({ studioId, studentName, initialPlan }: { studioId: string; studentName: string; initialPlan: TeacherPlan }) {
  const [plan, setPlan] = useState<TeacherPlan>(initialPlan);

  return (
    <form action={saveTeacherPlanAction} className="plan-editor">
      <input type="hidden" name="studioId" value={studioId} />
      <input type="hidden" name="planJson" value={JSON.stringify(plan)} />

      <section className="plan-editor-section">
        <div className="plan-section-heading"><div><span>Plan overview</span><h3>What the lesson is trying to change</h3></div><SourceBadges ids={plan.sourceSectionIds} /></div>
        <label className="wide-field"><span>Overview</span><textarea value={plan.overview} onChange={(event) => setPlan({ ...plan, overview: event.target.value })} rows={3} /></label>
        <ListField label="Success criteria" values={plan.successCriteria} onChange={(index, value) => setPlan({ ...plan, successCriteria: plan.successCriteria.map((item, itemIndex) => itemIndex === index ? value : item) })} />
      </section>

      <section className="plan-editor-section">
        <div className="plan-section-heading"><div><span>Lesson sequence</span><h3>Teacher moves and learner moves</h3></div><BookOpenCheck aria-hidden="true" /></div>
        <div className="sequence-editor-list">{plan.learningSequence.map((item, index) => <article key={`${item.phase}-${index}`}><div className="sequence-editor-head"><span>{index + 1}</span><input value={item.title} aria-label={`Step ${index + 1} title`} onChange={(event) => setPlan({ ...plan, learningSequence: plan.learningSequence.map((step, stepIndex) => stepIndex === index ? { ...step, title: event.target.value } : step) })} /><label>Minutes<input type="number" min={2} max={40} value={item.minutes} onChange={(event) => setPlan({ ...plan, learningSequence: plan.learningSequence.map((step, stepIndex) => stepIndex === index ? { ...step, minutes: Number(event.target.value) } : step) })} /></label></div><label>Teacher move<textarea rows={2} value={item.teacherMove} onChange={(event) => setPlan({ ...plan, learningSequence: plan.learningSequence.map((step, stepIndex) => stepIndex === index ? { ...step, teacherMove: event.target.value } : step) })} /></label><label>Learner move<textarea rows={2} value={item.learnerMove} onChange={(event) => setPlan({ ...plan, learningSequence: plan.learningSequence.map((step, stepIndex) => stepIndex === index ? { ...step, learnerMove: event.target.value } : step) })} /></label><SourceBadges ids={item.sourceSectionIds} /></article>)}</div>
      </section>

      <section className="plan-editor-section">
        <div className="plan-section-heading"><div><span>Differentiate instruction</span><h3>Keep the goal, change the route</h3></div></div>
        <div className="planning-card-grid">{plan.differentiation.map((item, index) => <article key={item.learnerNeed}><strong>{item.learnerNeed.replaceAll("_", " ")}</strong><label>Teacher move<textarea rows={3} value={item.teacherMove} onChange={(event) => setPlan({ ...plan, differentiation: plan.differentiation.map((move, moveIndex) => moveIndex === index ? { ...move, teacherMove: event.target.value } : move) })} /></label><label>Learner choice<textarea rows={2} value={item.learnerChoice} onChange={(event) => setPlan({ ...plan, differentiation: plan.differentiation.map((move, moveIndex) => moveIndex === index ? { ...move, learnerChoice: event.target.value } : move) })} /></label><SourceBadges ids={item.sourceSectionIds} /></article>)}</div>
      </section>

      <section className="plan-editor-section">
        <div className="plan-section-heading"><div><span>Anticipate and assess</span><h3>Ideas to check before they become conclusions</h3></div></div>
        <div className="planning-card-grid two-up">{plan.misconceptions.map((item, index) => <article key={`misconception-${index}`}><label>Idea to check<textarea rows={2} value={item.ideaToCheck} onChange={(event) => setPlan({ ...plan, misconceptions: plan.misconceptions.map((probe, probeIndex) => probeIndex === index ? { ...probe, ideaToCheck: event.target.value } : probe) })} /></label><label>Probe<textarea rows={2} value={item.probe} onChange={(event) => setPlan({ ...plan, misconceptions: plan.misconceptions.map((probe, probeIndex) => probeIndex === index ? { ...probe, probe: event.target.value } : probe) })} /></label><label>Teacher response<textarea rows={2} value={item.teacherResponse} onChange={(event) => setPlan({ ...plan, misconceptions: plan.misconceptions.map((probe, probeIndex) => probeIndex === index ? { ...probe, teacherResponse: event.target.value } : probe) })} /></label><SourceBadges ids={item.sourceSectionIds} /></article>)}</div>
        <div className="planning-card-grid two-up quick-check-grid">{plan.quickChecks.map((item, index) => <article key={`check-${index}`}><label>Check prompt<textarea rows={2} value={item.prompt} onChange={(event) => setPlan({ ...plan, quickChecks: plan.quickChecks.map((check, checkIndex) => checkIndex === index ? { ...check, prompt: event.target.value } : check) })} /></label><label>Evidence to notice<textarea rows={2} value={item.evidenceToNotice} onChange={(event) => setPlan({ ...plan, quickChecks: plan.quickChecks.map((check, checkIndex) => checkIndex === index ? { ...check, evidenceToNotice: event.target.value } : check) })} /></label><SourceBadges ids={item.sourceSectionIds} /></article>)}</div>
      </section>

      <section className="plan-editor-section agency-plan-section">
        <div className="plan-section-heading"><div><span>Learner agency</span><h3>Choice, making, critique, revision, and reflection</h3></div></div>
        <div className="planning-card-grid">{plan.interestHooks.map((item, index) => <article key={`interest-${index}`}><label>Interest route<input value={item.title} onChange={(event) => setPlan({ ...plan, interestHooks: plan.interestHooks.map((hook, hookIndex) => hookIndex === index ? { ...hook, title: event.target.value } : hook) })} /></label><label>Prompt<textarea rows={3} value={item.prompt} onChange={(event) => setPlan({ ...plan, interestHooks: plan.interestHooks.map((hook, hookIndex) => hookIndex === index ? { ...hook, prompt: event.target.value } : hook) })} /></label></article>)}</div>
        <div className="planning-card-grid">{plan.makerChoices.map((item, index) => <article key={item.id}><label>Maker path<input value={item.title} onChange={(event) => setPlan({ ...plan, makerChoices: plan.makerChoices.map((choice, choiceIndex) => choiceIndex === index ? { ...choice, title: event.target.value } : choice) })} /></label><label>Challenge<textarea rows={3} value={item.prompt} onChange={(event) => setPlan({ ...plan, makerChoices: plan.makerChoices.map((choice, choiceIndex) => choiceIndex === index ? { ...choice, prompt: event.target.value } : choice) })} /></label><label>Evidence to capture<textarea rows={2} value={item.evidenceToCapture} onChange={(event) => setPlan({ ...plan, makerChoices: plan.makerChoices.map((choice, choiceIndex) => choiceIndex === index ? { ...choice, evidenceToCapture: event.target.value } : choice) })} /></label><div className="constraint-list">{item.constraints.map((constraint, constraintIndex) => <label key={`${item.id}-${constraintIndex}`}>Constraint {constraintIndex + 1}<input value={constraint} onChange={(event) => setPlan({ ...plan, makerChoices: plan.makerChoices.map((choice, choiceIndex) => choiceIndex === index ? { ...choice, constraints: choice.constraints.map((value, valueIndex) => valueIndex === constraintIndex ? event.target.value : value) } : choice) })} /></label>)}</div></article>)}</div>
        <div className="plan-prompt-columns"><ListField label="Socratic prompts" values={plan.socraticPrompts} onChange={(index, value) => setPlan({ ...plan, socraticPrompts: plan.socraticPrompts.map((item, itemIndex) => itemIndex === index ? value : item) })} /><ListField label="Reflection prompts" values={plan.reflectionPrompts} onChange={(index, value) => setPlan({ ...plan, reflectionPrompts: plan.reflectionPrompts.map((item, itemIndex) => itemIndex === index ? value : item) })} /></div>
      </section>

      <section className="plan-editor-section family-plan-section">
        <div className="plan-section-heading"><div><span>Family communication</span><h3>One plain activity for home</h3></div><span className="status-badge">{plan.familyLocale === "ml" ? "മലയാളം" : "English"}</span></div>
        <label className="wide-field"><span>Family activity</span><textarea lang={plan.familyLocale} rows={5} value={plan.familyActivity} onChange={(event) => setPlan({ ...plan, familyActivity: event.target.value })} /></label>
      </section>

      <div className="plan-save-bar"><p><strong>You remain the author.</strong> Save a draft whenever you want. Publishing below always includes the edits currently on this screen.</p><button className="button secondary" type="submit" formNoValidate><Save aria-hidden="true" />Save teacher edits</button></div>

      <section className="portal-card publish-studio-card">
        <div><p className="eyebrow">Human decision</p><h2>Publish only the plan you are willing to teach</h2><p>The learner receives the maker choices and scaffold level. The parent sees nothing until you review the learner evidence.</p></div>
        <label className="confirmation-check"><input type="checkbox" name="reviewed" value="yes" required /><span><strong>I reviewed the plan against the curriculum sections.</strong><small>I checked the learning goal, source references, learner prompts, and family wording.</small></span></label>
        <button className="button primary" type="submit" formAction={publishLearningStudioAction}><UserRoundCheck aria-hidden="true" />Publish to {studentName}<ArrowRight aria-hidden="true" /></button>
      </section>
    </form>
  );
}
