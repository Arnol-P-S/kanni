import type { Metadata } from "next";
import { CheckCircle2, LockKeyhole, MessageCircleMore } from "lucide-react";

import { recordFamilyResponseAction } from "@/app/actions/demo";
import { PortalChrome, WaitingCard } from "@/components/portal-chrome";
import { requireDemoActor, readDemoCycle } from "@/lib/demo-server";
import { growthSupportPresentations } from "@/lib/growth-support-presentations";

export const metadata: Metadata = { title: "Parent portal" };

export default async function ParentPortalPage() {
  const actor = await requireDemoActor("guardian");
  const cycle = await readDemoCycle();
  const malayalam = cycle.mapping.familyLanguage === "ml";
  const reviewedSupport = growthSupportPresentations[
    cycle.teacherReview.nextSupport ?? cycle.plan.selectedSupport
  ];

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title="One clear update and one useful thing to try"
      intro="The parent view leaves out raw prompts, model transcripts, ranks, private reflections, and teacher-only notes."
    >
      {!cycle.mapping.guardianLinked ? (
        <WaitingCard title="No verified synthetic guardian link" detail="The admin must link this guardian profile to the learner before any family update is visible." />
      ) : !cycle.teacherReview.familyBriefApproved ? (
        <WaitingCard title="The teacher has not released a family update yet" detail="Family information appears only after the teacher reviews the activity evidence and approves the wording." />
      ) : (
        <div className="portal-grid parent-portal-grid">
          <section className="portal-card primary-task">
            <p className="eyebrow">What happened in this learning cycle</p>
            <h2>The learner compared one half and one quarter.</h2>
            <p>
              The first choice was {cycle.student.firstAnswer === "one_quarter" ? "one quarter" : "one half"}. A visual support was used, and the follow-up choice was {cycle.student.revisedAnswer === "one_half" ? "one half" : "one quarter"}.
            </p>
            <div className="family-activity">
              <MessageCircleMore aria-hidden="true" />
              <div>
                <p className="eyebrow">Try this once at home</p>
                <h3 lang={malayalam ? "ml" : "en"}>{reviewedSupport.familyTitle[malayalam ? "ml" : "en"]}</h3>
                <p lang={malayalam ? "ml" : "en"}>{reviewedSupport.familyDetail[malayalam ? "ml" : "en"]}</p>
                <p>Stop if the learner is tired or does not want to continue.</p>
              </div>
            </div>

            {cycle.family.response === "not_sent" ? (
              <form action={recordFamilyResponseAction} className="family-response-form">
                <button type="submit" name="response" value="tried">Tried it</button>
                <button type="submit" name="response" value="need_another_idea">Need another idea</button>
                <button type="submit" name="response" value="contact_teacher">I would like to speak with the teacher</button>
              </form>
            ) : (
              <p className="completion-line"><CheckCircle2 aria-hidden="true" /> Response sent: {cycle.family.response.replaceAll("_", " ")}.</p>
            )}
          </section>

          <aside className="portal-card privacy-card">
            <LockKeyhole aria-hidden="true" />
            <h2>What this view does not contain</h2>
            <ul><li>Raw student prompts</li><li>Model transcripts</li><li>Rank or score</li><li>Diagnostic or ability labels</li><li>Private teacher notes</li></ul>
          </aside>
        </div>
      )}
    </PortalChrome>
  );
}
