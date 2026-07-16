import type { Metadata } from "next";
import { CheckCircle2, HelpCircle, MessageSquareWarning } from "lucide-react";

import {
  flagStudentDisagreementAction,
  recordFirstAnswerAction,
  recordRevisionAction,
  useStudentSupportAction,
} from "@/app/actions/demo";
import { FractionVisual } from "@/components/fraction-visual";
import { PortalChrome, WaitingCard } from "@/components/portal-chrome";
import { requireDemoActor, readDemoCycle } from "@/lib/demo-server";
import { supportLabels } from "@/lib/growth-cycle";
import { growthSupportPresentations } from "@/lib/growth-support-presentations";

export const metadata: Metadata = { title: "Student portal" };

export default async function StudentPortalPage() {
  const actor = await requireDemoActor("student");
  const cycle = await readDemoCycle();
  const firstSupport = growthSupportPresentations[cycle.plan.selectedSupport];

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title="Try, ask for another way, and explain what you think"
      intro="You can ask for support before trying again. Kanni does not rank you or decide what you are capable of."
    >
      {!cycle.mapping.studentEnrolled ? (
        <WaitingCard title="Your learning circle is not ready" detail="The synthetic admin must map the support circle first." />
      ) : cycle.plan.status !== "published" ? (
        <WaitingCard title="Your teacher is reviewing the learning plan" detail="This activity appears only after the teacher publishes the goal and first support." />
      ) : (
        <div className="portal-stack student-stack">
          <section className="portal-card learning-goal-card">
            <p className="eyebrow">What am I learning?</p>
            <h2>Compare one half and one quarter</h2>
            <p>Both fractions use the same-sized whole. Try before opening support.</p>
          </section>

          {!cycle.student.firstAnswer ? (
            <section className="portal-card primary-task">
              <p className="eyebrow">First attempt</p>
              <h2>Which shaded amount would be larger?</h2>
              <form action={recordFirstAnswerAction} className="choice-form">
                <button type="submit" name="answer" value="one_half">One half</button>
                <button type="submit" name="answer" value="one_quarter">One quarter</button>
              </form>
            </section>
          ) : null}

          {cycle.student.firstAnswer && !cycle.student.supportUsed ? (
            <section className="portal-card primary-task" id="support">
              <p className="eyebrow">Ask for support</p>
              <h2>You chose {cycle.student.firstAnswer === "one_quarter" ? "one quarter" : "one half"}.</h2>
              <p>Open a visual explanation, then decide whether you want to revise your answer.</p>
              <form action={useStudentSupportAction}>
                <button className="button primary" type="submit"><HelpCircle size={19} aria-hidden="true" /> Show me another way</button>
              </form>
            </section>
          ) : null}

          {cycle.student.supportUsed && !cycle.student.revisedAnswer ? (
            <section className="portal-card primary-task" id="support">
              <div className="card-heading-row"><div><p className="eyebrow">Teacher-selected support · {cycle.student.supportOrigin === "gpt_5_6" ? "GPT-5.6 draft" : "Reviewed static support"}</p><h2>{firstSupport.studentTitle}</h2></div></div>
              {cycle.plan.selectedSupport === "fraction_strips" ? (
                <FractionVisual />
              ) : (
                <ol className="support-step-list">
                  {firstSupport.studentSteps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
              <p className="support-explanation">{cycle.student.support.explanation}</p>
              <form action={recordRevisionAction} className="revision-form">
                <fieldset>
                  <legend>Try the comparison again</legend>
                  <label><input type="radio" name="answer" value="one_half" required /> One half is larger</label>
                  <label><input type="radio" name="answer" value="one_quarter" required /> One quarter is larger</label>
                </fieldset>
                <fieldset>
                  <legend>Choose the reason closest to your thinking</legend>
                  <label><input type="radio" name="explanation" value="same_whole_more_equal_parts" required /> With the same whole, more equal parts make each part smaller.</label>
                  <label><input type="radio" name="explanation" value="four_is_bigger" required /> Four is a bigger number than two.</label>
                  <label><input type="radio" name="explanation" value="not_sure" required /> I am still not sure.</label>
                </fieldset>
                <button className="button primary" type="submit">Send my explanation to the teacher</button>
              </form>
            </section>
          ) : null}

          {cycle.student.revisedAnswer ? (
            <section className="portal-card completion-card">
              <CheckCircle2 aria-hidden="true" />
              <div><p className="eyebrow">Evidence sent</p><h2>You revised your choice to {cycle.student.revisedAnswer === "one_half" ? "one half" : "one quarter"}.</h2><p>Your teacher sees this activity result and the support used. It is not an ability label.</p></div>
              {!cycle.student.disagreedWithRecord ? (
                <form action={flagStudentDisagreementAction}><button className="button quiet" type="submit"><MessageSquareWarning size={18} aria-hidden="true" /> This does not reflect what I meant</button></form>
              ) : <p className="completion-line">Your teacher will see that you asked for a review.</p>}
            </section>
          ) : null}

          {cycle.teacherReview.nextSupport ? (
            <section className="portal-card next-step-card"><p className="eyebrow">Your teacher’s next step</p><h2>{supportLabels[cycle.teacherReview.nextSupport]}</h2><p>The next activity uses this teacher-reviewed support.</p></section>
          ) : null}
        </div>
      )}
    </PortalChrome>
  );
}
