import { AiStatus, SchoolRole, StudioStatus } from "@prisma/client";
import type { Metadata } from "next";
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileCheck2,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import {
  generateTeacherPlanAction,
  reviewLearnerWorkAction,
} from "@/app/actions/studio";
import { CreateStudioForm } from "@/components/create-studio-form";
import { EmptyWorkspace, PortalChrome, studioStageLabel } from "@/components/portal-chrome";
import { TeacherPlanEditor } from "@/components/teacher-plan-editor";
import { TeacherPlanView } from "@/components/teacher-plan-view";
import { getStudioAiCapability } from "@/lib/ai/studio-ai";
import { requireActor } from "@/lib/auth";
import { getTeacherWorkspace } from "@/lib/school-data";
import {
  parseTeacherPlan,
  StudentThinkingCoachSchema,
} from "@/lib/studio/contracts";
import { nextScaffoldSuggestion, planOriginLabel } from "@/lib/studio/workflow";

export const metadata: Metadata = { title: "Teacher learning studios" };

const notices: Record<string, string> = {
  "studio-created": "The studio is ready for planning. No AI request was made.",
  "ai-plan-ready": "The grounded AI draft is ready. Review and edit it before publishing.",
  "ai-plan-unavailable": "The AI draft was not used. Your teacher-owned starting plan is still available.",
  "plan-saved": "Your teacher edits were saved.",
  "studio-published": "The reviewed studio is now open to the learner.",
  "review-complete": "The learner feedback and family activity are ready.",
  "remove-personal-data": "Remove contact details or web addresses before saving.",
  "use-observation-language": "Describe what happened in the work. Do not label or diagnose the learner.",
  "complete-review": "Complete every review field and confirm that you read the evidence.",
  "review-plan-first": "Review the plan and confirm the source before publishing.",
  "support-circle-incomplete": "The administrator must reconnect the teacher, learner, and parent before publishing.",
  "invalid-plan": "The plan could not be validated. Check every field and source reference.",
  "invalid-citations": "A source reference is not part of this curriculum pack.",
  "plan-locked": "This plan has already moved to the next stage.",
  "ai-already-used": "This studio has already claimed its one AI planning request.",
};

export default async function TeacherPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ studio?: string; notice?: string; new?: string }>;
}) {
  const actor = await requireActor(SchoolRole.teacher);
  const params = await searchParams;
  const workspace = await getTeacherWorkspace(actor, params.studio);
  if (!workspace) return null;
  const studio = workspace.selectedStudio;
  const plan = studio ? parseTeacherPlan(studio.plan) : null;
  const teacherAiRun = studio?.aiRuns.find((run) => run.purpose === "teacher_plan") ?? null;
  const studentHelp = studio?.studentHelp
    ? StudentThinkingCoachSchema.safeParse(studio.studentHelp.response)
    : null;
  const ai = getStudioAiCapability();
  const submission = studio?.submission ?? null;
  const students = workspace.assignments.map(({ studentMembership }) => ({
    id: studentMembership.id,
    displayName: studentMembership.user.displayName,
    parentName:
      studentMembership.studentGuardians[0]?.guardianMembership.user.displayName ?? null,
  }));
  const showBuilder = params.new === "1" || !studio;
  const evidenceTrail = studio && plan && submission ? <>
    <div className="evidence-sequence">
      <article><span>1</span><small>Prediction</small><p>{submission.prediction}</p></article>
      <article><span>2</span><small>First version</small><p>{submission.firstDraft}</p></article>
      <article><span>3</span><small>Self-critique</small><p>{submission.selfCritique}</p></article>
      <article><span>4</span><small>Revision</small><p>{submission.revision}</p></article>
      <article><span>5</span><small>Reason for change</small><p>{submission.explanation}</p></article>
      <article><span>6</span><small>Reflection</small><p>{submission.reflection}</p></article>
    </div>
    <div className="evidence-context-row"><span><strong>Chosen route:</strong> {plan.interestHooks[submission.interestHookIndex]?.title ?? "Student choice"}</span><span><strong>Maker path:</strong> {plan.makerChoices.find((choice) => choice.id === submission.makerChoiceId)?.title ?? submission.makerChoiceId}</span><span><strong>Opened support:</strong> {submission.supportOpened ? "Yes" : "No"}</span></div>
    {studentHelp?.success ? <details className="teacher-student-help-audit"><summary>Review the AI questions the learner saw</summary><p>Kanni did not add the learner&apos;s account name or family records. The request used the learner&apos;s first attempt and cited curriculum sections.</p><p className="ai-audit-metadata">{studio.studentHelp?.model} · {studio.studentHelp?.promptVersion}</p><ol>{studentHelp.data.creativeSteps.map((step) => <li key={`${step.title}-${step.question}`}><strong>{step.title}</strong><span>{step.question}</span><small>{step.sourceSectionIds.join(", ")}</small></li>)}</ol></details> : null}
  </> : null;

  return (
    <PortalChrome
      actor={actor}
      studio={studio}
      title="Plan once, create several ways to think"
      intro="Ground instruction in curriculum you can use, prepare different routes to the same goal, and decide when each learner is ready for less support."
    >
      {params.notice ? <p className="form-notice portal-notice" role="status">{notices[params.notice] ?? "The learning studio was updated."}</p> : null}
      <div className="teacher-portal-layout">
        <aside className="studio-list-panel" aria-label="Learning studios">
          <div className="studio-list-heading"><div><span>Your studios</span><strong>{workspace.studios.length}</strong></div><Link className="button compact secondary" href="/portal/teacher?new=1"><Plus aria-hidden="true" />New</Link></div>
          {workspace.studios.length === 0 ? <p>No studio yet. Start with a learner, a thinking goal, and a permission-safe source.</p> : <nav>{workspace.studios.map((item) => <Link key={item.id} href={`/portal/teacher?studio=${item.id}`} data-current={studio?.id === item.id && !showBuilder}><strong>{item.title}</strong><span>{item.studentMembership.user.displayName}</span><small>{studioStageLabel(item.status, actor.locale)}</small></Link>)}</nav>}
          <div className="teacher-ai-total"><Sparkles aria-hidden="true" /><span><strong>{workspace.aiUsage._count._all} AI planning requests</strong><small>${((workspace.aiUsage._sum.costMicros ?? 0) / 1_000_000).toFixed(4)} recorded provider cost</small></span></div>
        </aside>

        <div className="teacher-studio-main">
          {showBuilder ? (
            <section className="portal-card studio-builder-card">
              <div className="card-heading-row"><div><p className="eyebrow">New learning studio</p><h2>Begin with a real goal and a source you control</h2><p>Creating the studio stores the source and builds a teacher-owned starting plan. It does not call OpenRouter.</p></div><BookOpenCheck aria-hidden="true" /></div>
              <CreateStudioForm
                students={students}
                curriculumPacks={workspace.curriculumPacks.map((pack) => ({
                  id: pack.id,
                  title: pack.title,
                  subject: pack.subject,
                  gradeLabel: pack.gradeLabel,
                  version: pack.version,
                  rightsBasis: pack.rightsBasis,
                  sectionCount: pack._count.sections,
                  studioCount: pack._count.studios,
                }))}
              />
            </section>
          ) : !studio ? (
            <EmptyWorkspace title="Choose or create a learning studio" detail="A studio connects one learner, one thinking goal, one curriculum source, and one reviewed family handoff." />
          ) : !plan ? (
            <EmptyWorkspace eyebrow="Plan validation" title="This plan needs repair" detail="Kanni could not validate the stored plan. Create a new studio while this record is reviewed." />
          ) : (
            <>
              <section className="portal-card studio-command-card">
                <div className="studio-command-heading"><div><p className="eyebrow">{studio.subject} · {studio.gradeLabel}</p><h2>{studio.title}</h2><p>{studio.drivingQuestion}</p></div><span className="status-badge">{studioStageLabel(studio.status, actor.locale)}</span></div>
                <dl className="studio-command-facts"><div><dt>Learner</dt><dd>{studio.studentMembership.user.displayName}</dd></div><div><dt>Family connection</dt><dd>{studio.guardianMembership?.user.displayName ?? "Not connected"}</dd></div><div><dt>Current scaffold</dt><dd>{studio.scaffoldLevel}</dd></div><div><dt>Plan origin</dt><dd>{planOriginLabel(studio.planOrigin, Boolean(studio.planReviewedAt))}</dd></div></dl>
              </section>

              <section className="portal-card curriculum-register-card">
                <div className="card-heading-row"><div><p className="eyebrow">Curriculum grounding</p><h2>{studio.curriculumPack.title}</h2><p>{studio.curriculumPack.sections.length} checksummed sections · version {studio.curriculumPack.version} · {studio.curriculumPack.rightsBasis.replaceAll("_", " ")}</p></div><FileCheck2 aria-hidden="true" /></div>
                <div className="curriculum-section-grid">{studio.curriculumPack.sections.map((section) => <article key={section.id}><span>{section.referenceId}</span><h3>{section.heading}</h3><p>{section.content}</p></article>)}</div>
                {studio.curriculumPack.sourceUrl ? <a className="source-link" href={studio.curriculumPack.sourceUrl} target="_blank" rel="noreferrer">Open source record<ExternalLink aria-hidden="true" /></a> : null}
              </section>

              {studio.status !== StudioStatus.planning && teacherAiRun ? <section className="portal-card ai-provenance-card">
                <div className="card-heading-row"><div><p className="eyebrow">Saved AI provenance</p><h2>The teacher reviewed one grounded GPT-5.6 planning draft</h2><p>The request is closed. Its model, prompt version, retrieved citations, and provider-reported cost stay attached to this studio.</p></div><Sparkles aria-hidden="true" /></div>
                <div className="ai-result-note success"><CheckCircle2 aria-hidden="true" /><span><strong>Grounded draft accepted for teacher review</strong><small>The teacher remained responsible for editing and publishing the plan.</small></span></div>
                <dl className="ai-run-facts"><div><dt>Model</dt><dd>{teacherAiRun.model}</dd></div><div><dt>Prompt</dt><dd>{teacherAiRun.promptVersion}</dd></div><div><dt>Citations</dt><dd>{Array.isArray(teacherAiRun.citationIds) ? teacherAiRun.citationIds.length : 0}</dd></div><div><dt>Recorded cost</dt><dd>${((teacherAiRun.costMicros ?? 0) / 1_000_000).toFixed(4)}</dd></div></dl>
              </section> : null}

              {studio.status === StudioStatus.planning ? (
                <>
                  <section className="portal-card ai-planning-card" data-status={studio.aiStatus}>
                    <div className="card-heading-row"><div><p className="eyebrow">Teacher planning assistant</p><h2>Draft the full toolkit from retrieved curriculum</h2><p>One explicit request drafts success criteria, sequence, differentiation, misconception probes, checks, learner choices, maker paths, reflection, and a family activity.</p></div><Sparkles aria-hidden="true" /></div>
                    <div className="ai-request-boundary"><div><ShieldCheck aria-hidden="true" /><span><strong>Sent</strong><small>The goal, driving question, grade, and up to six relevant curriculum sections.</small></span></div><div><ShieldCheck aria-hidden="true" /><span><strong>Not added by Kanni</strong><small>Account names, student work, parent notes, passwords, or prior model conversations. Keep names out of the teacher-written goal and source.</small></span></div><div><ShieldCheck aria-hidden="true" /><span><strong>Release check</strong><small>Unsafe text or an unknown source ID discards the entire generated draft.</small></span></div></div>
                    <div className="ai-request-status" aria-live="polite">
                      {studio.aiStatus === AiStatus.not_requested ? (
                        <form action={generateTeacherPlanAction} className="ai-request-action"><input type="hidden" name="studioId" value={studio.id} /><button className="button ai-button" type="submit" disabled={!ai.available}><Sparkles aria-hidden="true" />Use one AI request to draft the plan</button><small>{ai.available ? `Configured model: ${ai.model}. No automatic retry or provider fallback.` : "AI is off or its release controls are incomplete. The local starting plan remains editable."}</small></form>
                      ) : (
                        <>
                          <div className={`ai-result-note ${studio.aiStatus === AiStatus.ready ? "success" : "attention"}`}><CheckCircle2 aria-hidden="true" /><span><strong>{studio.aiStatus === AiStatus.ready ? "One grounded planning request completed" : "The local plan was kept"}</strong><small>{studio.aiStatus === AiStatus.ready ? "Edit the draft below, compare it with the curriculum sections, then publish only after review." : "The request was unavailable or rejected. Kanni did not expose generated text."}</small></span></div>
                          <div className="ai-request-action used"><button className="button ai-button" type="button" disabled><Sparkles aria-hidden="true" />{studio.aiStatus === AiStatus.ready ? "AI planning request used" : "AI request closed"}</button><small>One request is allowed per studio to control cost and prevent hidden retries. Create a new versioned studio if the goal changes.</small></div>
                          {teacherAiRun ? <dl className="ai-run-facts"><div><dt>Model</dt><dd>{teacherAiRun.model}</dd></div><div><dt>Prompt</dt><dd>{teacherAiRun.promptVersion}</dd></div><div><dt>Citations</dt><dd>{Array.isArray(teacherAiRun.citationIds) ? teacherAiRun.citationIds.length : 0}</dd></div><div><dt>Recorded cost</dt><dd>${((teacherAiRun.costMicros ?? 0) / 1_000_000).toFixed(4)}</dd></div></dl> : null}
                        </>
                      )}
                    </div>
                  </section>
                  <TeacherPlanEditor studioId={studio.id} studentName={studio.studentMembership.user.displayName} initialPlan={plan} />
                </>
              ) : studio.status === StudioStatus.ready_for_student ? (
                <section className="portal-card active-handoff-card"><Clock3 aria-hidden="true" /><div><p className="eyebrow">With the learner</p><h2>The student is choosing, making, critiquing, and revising</h2><p>Kanni will bring the full evidence sequence here after submission. AI can offer one grounded set of questions after a first attempt, but it cannot answer or submit the activity.</p><span className="status-badge">Thinking coach: {studio.studentHelpStatus.replaceAll("_", " ")}</span></div></section>
              ) : studio.status === StudioStatus.awaiting_teacher_review && submission ? (
                <section className="portal-card evidence-review-card">
                  <div className="card-heading-row"><div><p className="eyebrow">Student-owned evidence</p><h2>Review the thinking process, not just the final version</h2></div><span className="status-badge attention">Needs your decision</span></div>
                  {evidenceTrail}
                  <form action={reviewLearnerWorkAction} className="teacher-review-form">
                    <input type="hidden" name="studioId" value={studio.id} />
                    <div className="form-grid two-columns"><div className="field-group"><label htmlFor="noticedStrength">What did the work show the learner doing well?</label><textarea id="noticedStrength" name="noticedStrength" rows={4} minLength={20} maxLength={500} placeholder="In this activity, the learner…" required /></div><div className="field-group"><label htmlFor="studentFeedback">Feedback the learner will receive</label><textarea id="studentFeedback" name="studentFeedback" rows={4} minLength={20} maxLength={700} placeholder="Your revision became stronger when…" required /></div></div>
                    <label htmlFor="nextQuestion">One next thinking question</label><textarea id="nextQuestion" name="nextQuestion" rows={2} minLength={10} maxLength={300} defaultValue={plan.reflectionPrompts[0]} required />
                    <fieldset className="scaffold-decision-grid"><legend>How much scaffold should the next studio begin with?</legend>{(["guided", "light", "independent"] as const).map((level) => <label key={level}><input type="radio" name="nextScaffoldLevel" value={level} defaultChecked={level === nextScaffoldSuggestion(studio.scaffoldLevel, submission.supportOpened)} /><span><strong>{level}</strong><small>{level === "guided" ? "Up to three teacher-reviewed prompts" : level === "light" ? "One teacher-reviewed prompt" : "No planned prompt at the start"}</small></span></label>)}</fieldset>
                    <label htmlFor="familyActivity">Reviewed family activity</label><textarea id="familyActivity" name="familyActivity" lang={studio.familyLocale} rows={5} minLength={30} maxLength={700} defaultValue={plan.familyActivity} required />
                    <label className="confirmation-check"><input type="checkbox" name="reviewedEvidence" value="yes" required /><span><strong>I read the prediction, first version, critique, revision, and reflection.</strong><small>This decision is based on this activity, not a diagnosis or ability label.</small></span></label>
                    <button className="button primary" type="submit"><ClipboardCheck aria-hidden="true" />Send feedback and open family activity</button>
                  </form>
                </section>
              ) : (
                <section className="portal-card reviewed-handoff-card">
                  <div className="card-heading-row"><div><p className="eyebrow">Teacher decision recorded</p><h2>{studio.status === StudioStatus.complete ? "The full support loop is complete" : "The reviewed family activity is open"}</h2></div><CheckCircle2 aria-hidden="true" /></div>
                  {studio.teacherReview ? <dl className="review-summary"><div><dt>Strength noticed</dt><dd>{studio.teacherReview.noticedStrength}</dd></div><div><dt>Feedback to learner</dt><dd>{studio.teacherReview.studentFeedback}</dd></div><div><dt>Next question</dt><dd>{studio.teacherReview.nextQuestion}</dd></div><div><dt>Next scaffold</dt><dd>{studio.teacherReview.nextScaffoldLevel}</dd></div></dl> : null}
                  <div className="family-status-row"><strong>Family response</strong><span className="status-badge">{studio.familyHandoff?.response.replaceAll("_", " ") ?? "not sent"}</span>{studio.familyHandoff?.parentNote ? <p>{studio.familyHandoff.parentNote}</p> : null}</div>
                  <Link className="button secondary" href="/portal/teacher?new=1"><Plus aria-hidden="true" />Create the next studio</Link>
                </section>
              )}

              {(studio.status === StudioStatus.ready_for_family || studio.status === StudioStatus.complete) && evidenceTrail ? <section className="portal-card evidence-review-card completed-evidence-card">
                <div className="card-heading-row"><div><p className="eyebrow">Student-owned evidence</p><h2>The full thinking record remains available after review</h2><p>The teacher can revisit the prediction, first version, critique, revision, explanation, reflection, and AI questions without exposing them to the parent or administrator.</p></div><span className="status-badge success">Reviewed</span></div>
                {evidenceTrail}
              </section> : null}

              {studio.status !== StudioStatus.planning ? <TeacherPlanView plan={plan} /> : null}
            </>
          )}
        </div>
      </div>
    </PortalChrome>
  );
}
