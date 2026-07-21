import {
  Brain,
  CheckCircle2,
  ClipboardCheck,
  MessageCircleMore,
  PenTool,
  Route,
} from "lucide-react";

import type { TeacherPlan } from "@/lib/studio/contracts";

function Sources({ ids }: { ids: string[] }) {
  return <span className="source-badges">{ids.map((id) => <span key={id}>{id}</span>)}</span>;
}

export function TeacherPlanView({ plan }: { plan: TeacherPlan }) {
  return (
    <div className="teacher-plan-view">
      <section className="portal-card plan-overview-card">
        <div className="card-heading-row"><div><p className="eyebrow">Plan for understanding</p><h2>{plan.overview}</h2></div><Sources ids={plan.sourceSectionIds} /></div>
        <div className="success-criteria-list"><h3>Success criteria</h3><ul>{plan.successCriteria.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}</ul></div>
      </section>

      <section className="portal-card plan-sequence-card">
        <div className="card-heading-row"><div><p className="eyebrow">Lesson sequence</p><h2>Teacher moves that keep the learner thinking</h2></div><Route aria-hidden="true" /></div>
        <ol className="lesson-sequence">{plan.learningSequence.map((item, index) => <li key={`${item.phase}-${index}`}><span>{index + 1}</span><div><small>{item.phase} · {item.minutes} min</small><h3>{item.title}</h3><dl><div><dt>Teacher</dt><dd>{item.teacherMove}</dd></div><div><dt>Learner</dt><dd>{item.learnerMove}</dd></div></dl><Sources ids={item.sourceSectionIds} /></div></li>)}</ol>
      </section>

      <section className="portal-card teacher-toolkit-card">
        <div className="card-heading-row"><div><p className="eyebrow">Teacher toolkit</p><h2>Differentiate without lowering the goal</h2></div><Brain aria-hidden="true" /></div>
        <div className="toolkit-grid">{plan.differentiation.map((item) => <article key={item.learnerNeed}><span>{item.learnerNeed.replaceAll("_", " ")}</span><h3>{item.teacherMove}</h3><p><strong>Learner choice:</strong> {item.learnerChoice}</p><Sources ids={item.sourceSectionIds} /></article>)}</div>
      </section>

      <section className="portal-card assessment-toolkit-card">
        <div className="card-heading-row"><div><p className="eyebrow">Anticipate and assess</p><h2>Probe the idea, not the child</h2></div><ClipboardCheck aria-hidden="true" /></div>
        <div className="assessment-columns"><div><h3>Ideas to check</h3>{plan.misconceptions.map((item, index) => <article key={`probe-${index}`}><strong>{item.ideaToCheck}</strong><p><b>Ask:</b> {item.probe}</p><p><b>Then:</b> {item.teacherResponse}</p><Sources ids={item.sourceSectionIds} /></article>)}</div><div><h3>Quick evidence checks</h3>{plan.quickChecks.map((item, index) => <article key={`check-${index}`}><strong>{item.prompt}</strong><p>{item.evidenceToNotice}</p><Sources ids={item.sourceSectionIds} /></article>)}</div></div>
      </section>

      <section className="portal-card learner-agency-card">
        <div className="card-heading-row"><div><p className="eyebrow">Learner agency</p><h2>The student chooses, makes, tests, and revises</h2></div><PenTool aria-hidden="true" /></div>
        <div className="agency-choice-columns"><div><h3>Interest routes</h3>{plan.interestHooks.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.prompt}</p></article>)}</div><div><h3>Maker paths</h3>{plan.makerChoices.map((item) => <article key={item.id}><strong>{item.title}</strong><p>{item.prompt}</p><small>{item.evidenceToCapture}</small></article>)}</div></div>
        <div className="prompt-bank"><div><h3>Socratic prompts</h3><ul>{plan.socraticPrompts.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>Reflection prompts</h3><ul>{plan.reflectionPrompts.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
      </section>

      <section className="portal-card family-plan-card">
        <div className="card-heading-row"><div><p className="eyebrow">Family communication</p><h2>One activity, reviewed by the teacher</h2></div><MessageCircleMore aria-hidden="true" /></div>
        <p className="family-activity-copy" lang={plan.familyLocale}>{plan.familyActivity}</p>
      </section>
    </div>
  );
}
