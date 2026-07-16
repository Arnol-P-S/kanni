import type { Metadata } from "next";
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  MessageCircleMore,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import {
  draftTeacherPlanWithAi,
  publishTeacherPlanAction,
  restoreProjectAuthoredPlan,
  reviewStudentEvidenceAction,
} from "@/app/actions/demo";
import { PortalChrome, WaitingCard } from "@/components/portal-chrome";
import { getGrowthAiCapability } from "@/lib/ai/growth-ai";
import { requireDemoActor, readDemoCycle } from "@/lib/demo-server";
import {
  hasCompleteSupportCircle,
  misconceptionLabels,
  supportLabels,
  type SupportStrategy,
} from "@/lib/growth-cycle";
import { growthSupportPresentations } from "@/lib/growth-support-presentations";

export const metadata: Metadata = { title: "Teacher portal" };

const strategies = Object.entries(supportLabels) as [SupportStrategy, string][];

export default async function TeacherPortalPage() {
  const actor = await requireDemoActor("teacher");
  const cycle = await readDemoCycle();
  const ai = getGrowthAiCapability();

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title="Plan, notice, and choose the next teaching move"
      intro="Kanni can draft. The teacher decides what students and families receive."
    >
      {!hasCompleteSupportCircle(cycle) ? (
        <WaitingCard
          title="The support circle is not mapped yet"
          detail="Sign in as the synthetic admin and connect the teacher, student, and guardian before publishing a learning plan."
        />
      ) : (
        <div className="portal-stack">
          <section className="portal-card primary-task" id="plan">
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">Teacher task 1 · Plan and publish</p>
                <h2>Compare one half and one quarter</h2>
              </div>
              <span className={`origin-badge ${cycle.plan.origin}`}>
                {cycle.plan.origin === "gpt_5_6" ? "GPT-5.6 draft" : "Reviewed static draft"}
              </span>
            </div>

            <div className="plan-grid">
              <div>
                <h3>Success criteria</h3>
                <ul>{cycle.plan.draft.successCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <h3>Short learning sequence</h3>
                <ol>{cycle.plan.draft.learningSequence.map((item) => <li key={item}>{item}</li>)}</ol>
              </div>
              <div>
                <h3>Misconceptions to check</h3>
                <ul>{cycle.plan.draft.misconceptionIds.map((id) => <li key={id}>{misconceptionLabels[id]}</li>)}</ul>
              </div>
              <div>
                <h3>Quick understanding check</h3>
                <p>{cycle.plan.draft.quickCheck}</p>
              </div>
              <div>
                <h3>Draft family wording</h3>
                <p>{cycle.plan.draft.familyDraft}</p>
              </div>
            </div>

            {cycle.plan.status === "draft" ? (
              <>
                <div className="ai-action-row">
                  <form action={draftTeacherPlanWithAi}>
                    <button className="button secondary" type="submit" disabled={!ai.available}>
                      <Sparkles size={18} aria-hidden="true" /> Draft with GPT-5.6
                    </button>
                  </form>
                  <form action={restoreProjectAuthoredPlan}>
                    <button className="button quiet" type="submit">
                      <RotateCcw size={18} aria-hidden="true" /> Restore reviewed draft
                    </button>
                  </form>
                  <span className="ai-availability">
                    <Bot size={17} aria-hidden="true" />
                    {ai.available ? `${ai.model} available` : "AI off. Reviewed draft remains usable."}
                  </span>
                </div>
                <form action={publishTeacherPlanAction} className="publish-form">
                  <fieldset>
                    <legend>Choose the first support</legend>
                    {strategies.map(([value, label]) => (
                      <label key={value}><input type="radio" name="strategy" value={value} defaultChecked={value === cycle.plan.selectedSupport} /> {label}</label>
                    ))}
                  </fieldset>
                  <button className="button primary" type="submit">Review and publish plan</button>
                </form>
              </>
            ) : (
              <p className="completion-line"><CheckCircle2 aria-hidden="true" /> Published with {supportLabels[cycle.plan.selectedSupport]}.</p>
            )}
          </section>

          <section className="portal-card" id="evidence">
            <div className="card-heading-row">
              <div><p className="eyebrow">Teacher task 2 · Review activity evidence</p><h2>What happened in this cycle</h2></div>
              <ClipboardCheck className="status-icon" aria-hidden="true" />
            </div>
            {!cycle.student.revisedAnswer ? (
              <p className="muted-copy">No completed student evidence yet. The teacher will see activity events, not an ability diagnosis.</p>
            ) : (
              <>
                <div className="evidence-grid">
                  <div><span>Initial choice</span><strong>{cycle.student.firstAnswer === "one_quarter" ? "One quarter" : "One half"}</strong></div>
                  <div><span>Support used</span><strong>{cycle.student.supportUsed ? "Yes" : "No"}</strong></div>
                  <div><span>Revised choice</span><strong>{cycle.student.revisedAnswer === "one_half" ? "One half" : "One quarter"}</strong></div>
                  <div><span>Learner challenge</span><strong>{cycle.student.disagreedWithRecord ? "Review requested" : "None"}</strong></div>
                </div>
                <p className="observation-copy">
                  In this activity, the initial answer was {cycle.student.firstAnswer === "one_quarter" ? "one quarter" : "one half"}, support was {cycle.student.supportUsed ? "used" : "not used"}, and the revised answer was {cycle.student.revisedAnswer === "one_half" ? "one half" : "one quarter"}. This is not a judgement about the learner.
                </p>
                {cycle.teacherReview.status === "pending" ? (
                  <form action={reviewStudentEvidenceAction} className="publish-form">
                    <fieldset className="strategy-review-options">
                      <legend>Choose the next support and its family activity</legend>
                      {strategies.map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="nextSupport"
                            value={value}
                            defaultChecked={value === cycle.plan.selectedSupport}
                          />
                          <span><strong>{label}</strong><small>{growthSupportPresentations[value].familyTitle.en}</small></span>
                        </label>
                      ))}
                    </fieldset>
                    <button className="button primary" type="submit">Approve next step and family brief</button>
                  </form>
                ) : (
                  <p className="completion-line"><CheckCircle2 aria-hidden="true" /> Next step approved: {cycle.teacherReview.nextSupport ? supportLabels[cycle.teacherReview.nextSupport] : "reviewed"}.</p>
                )}
              </>
            )}
          </section>

          <section className="portal-card family-signal-card">
            <MessageCircleMore aria-hidden="true" />
            <div><p className="eyebrow">Family signal</p><h2>{cycle.family.response === "not_sent" ? "No family response yet" : cycle.family.response.replaceAll("_", " ")}</h2><p>The teacher sees only the parent’s bounded response in this demo.</p></div>
          </section>
        </div>
      )}
    </PortalChrome>
  );
}
