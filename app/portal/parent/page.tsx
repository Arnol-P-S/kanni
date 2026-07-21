import { FamilyResponse, SchoolRole, StudioStatus } from "@prisma/client";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Home,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { recordFamilyResponseAction } from "@/app/actions/studio";
import { EmptyWorkspace, PortalChrome } from "@/components/portal-chrome";
import { requireActor } from "@/lib/auth";
import { getParentStudio } from "@/lib/school-data";

export const metadata: Metadata = { title: "Parent home connection" };

const notices: Record<string, string> = {
  "response-sent": "Your response has returned to the teacher.",
  "choose-response": "Choose what happened before sending your response.",
  "remove-personal-data": "Remove contact details and web links from the note.",
  "activity-closed": "This family activity has already been completed.",
};

export default async function ParentPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const actor = await requireActor(SchoolRole.parent);
  const studio = await getParentStudio(actor);
  const { notice } = await searchParams;

  return (
    <PortalChrome
      actor={actor}
      studio={studio}
      title="Continue one useful idea at home"
      intro="See the learning goal, one teacher observation, and one short activity. Raw student work and model output stay out of this view."
    >
      {notice === "safety-support" ? <p className="form-error portal-notice" role="alert">If someone may be in immediate danger, call 112. Childline is 1098 and Tele-MANAS is 14416.</p> : notice ? <p className="form-notice portal-notice" role="status">{notices[notice] ?? "The family activity was updated."}</p> : null}
      {!studio || !studio.teacherReview || !studio.familyHandoff ? (
        <EmptyWorkspace title="The teacher is still reviewing the learning work" detail="A family activity appears only after the assigned teacher reads the student evidence and approves the wording." />
      ) : (
        <div className="workspace-grid parent-workspace-grid">
          <section className="portal-card parent-context-card">
            <div className="card-heading-row"><div><p className="eyebrow">What {studio.studentMembership.user.displayName} worked on</p><h2>{studio.goal}</h2><p>{studio.subject} · {studio.gradeLabel}</p></div><Home aria-hidden="true" /></div>
            <div className="parent-context-grid"><article><span>Teacher noticed</span><p>{studio.teacherReview.noticedStrength}</p></article><article><span>Question to keep thinking</span><p>{studio.teacherReview.nextQuestion}</p></article></div>
            <div className="parent-privacy-note"><ShieldCheck aria-hidden="true" /><span><strong>A small, reviewed handoff</strong><small>This page does not contain the learner&apos;s prediction, draft, critique, revision, model transcript, rank, score, or diagnosis.</small></span></div>
          </section>

          <section className="portal-card family-activity-card">
            <div className="card-heading-row"><div><p className="eyebrow">Try this together</p><h2>One activity for home</h2></div><MessageCircle aria-hidden="true" /></div>
            <p className="family-activity-copy" lang={studio.familyLocale}>{studio.familyHandoff.activity}</p>
            <p className="family-coaching-tip"><strong>Helpful adult move:</strong> Ask the question, wait, and listen for the reason. Let the learner change their mind when the evidence changes.</p>
          </section>

          {studio.status === StudioStatus.ready_for_family && studio.familyHandoff.response === FamilyResponse.not_sent ? (
            <section className="portal-card family-response-card">
              <div><p className="eyebrow">Close the loop</p><h2>Tell the teacher what happened</h2><p>Choose one response. You can edit the optional note until you send it; after submission, the handoff is locked.</p></div>
              <form action={recordFamilyResponseAction}>
                <input type="hidden" name="studioId" value={studio.id} />
                <fieldset className="family-response-options"><legend>What happened at home?</legend><label><input type="radio" name="response" value="tried" required /><span><strong>We tried it</strong><small>The activity was clear enough to use.</small></span></label><label><input type="radio" name="response" value="need_another_idea" required /><span><strong>We need another idea</strong><small>A different activity would help.</small></span></label><label><input type="radio" name="response" value="contact_teacher" required /><span><strong>Please contact me</strong><small>I want to discuss the next step.</small></span></label></fieldset>
                <label htmlFor="parentNote">Short note <span className="optional-label">optional</span></label><textarea id="parentNote" name="note" rows={3} maxLength={400} placeholder="We noticed…" />
                <button className="button primary" type="submit">Send response to teacher</button>
              </form>
            </section>
          ) : (
            <section className="portal-card family-complete-card"><CheckCircle2 aria-hidden="true" /><div><p className="eyebrow">Response sent</p><h2>The teacher has your update</h2><p>Your response: <strong>{studio.familyHandoff.response.replaceAll("_", " ")}</strong></p>{studio.familyHandoff.parentNote ? <p>{studio.familyHandoff.parentNote}</p> : null}</div></section>
          )}
        </div>
      )}
    </PortalChrome>
  );
}
