import type { Metadata } from "next";
import {
  CheckCircle2,
  Languages,
  Link2,
  School,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

import { mapSupportCircleAction } from "@/app/actions/demo";
import { PortalChrome } from "@/components/portal-chrome";
import { requireDemoActor, readDemoCycle } from "@/lib/demo-server";
import { hasCompleteSupportCircle } from "@/lib/growth-cycle";

export const metadata: Metadata = { title: "Admin portal" };

export default async function AdminPortalPage() {
  const actor = await requireDemoActor("tenant_admin");
  const cycle = await readDemoCycle();
  const mapped = hasCompleteSupportCircle(cycle);
  const completedHandoffs = [
    mapped,
    cycle.plan.status === "published",
    Boolean(cycle.student.revisedAnswer),
    cycle.teacherReview.familyBriefApproved,
    cycle.family.response !== "not_sent",
  ].filter(Boolean).length;

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title="Map the people who support this learning goal"
      intro="Admin manages membership, policy, and operational status. Admin does not receive raw learner prompts or private reflections."
    >
      <div className="portal-grid admin-grid">
        <section className="portal-card primary-task">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Today’s admin task</p>
              <h2>{mapped ? "Support circle mapped" : "Confirm the synthetic support circle"}</h2>
            </div>
            {mapped ? <CheckCircle2 className="status-icon success" aria-label="Complete" /> : <UserRoundCog className="status-icon" aria-hidden="true" />}
          </div>

          <div className="mapping-list" aria-label="Synthetic relationship map">
            <div><School aria-hidden="true" /><span><strong>Meera</strong><small>Teacher assigned to Learning Circle A</small></span></div>
            <div><Link2 aria-hidden="true" /><span><strong>Diya</strong><small>Student enrolled in Learning Circle A</small></span></div>
            <div><Link2 aria-hidden="true" /><span><strong>Arun</strong><small>Guardian linked only to Diya</small></span></div>
          </div>

          <form action={mapSupportCircleAction} className="stacked-form">
            <label htmlFor="familyLanguage">
              <Languages size={18} aria-hidden="true" /> Family update language
            </label>
            <select
              id="familyLanguage"
              name="familyLanguage"
              defaultValue={cycle.mapping.familyLanguage}
            >
              <option value="ml">Malayalam preview</option>
              <option value="en">English</option>
            </select>
            <button className="button primary" type="submit">
              {mapped ? "Update support-circle settings" : "Confirm support circle"}
            </button>
          </form>
        </section>

        <section className="portal-card metric-card">
          <p className="eyebrow">Operational view</p>
          <h2>{completedHandoffs} of 5 handoffs complete</h2>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Learning-cycle handoffs complete"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={completedHandoffs}
            aria-valuetext={`${completedHandoffs} of 5 handoffs complete`}
          >
            <span style={{ width: `${completedHandoffs * 20}%` }} />
          </div>
          <ul className="plain-list">
            <li><span>Unreviewed student cycles</span><strong>{cycle.student.revisedAnswer && cycle.teacherReview.status === "pending" ? 1 : 0}</strong></li>
            <li><span>Family updates ready</span><strong>{cycle.teacherReview.familyBriefApproved ? 1 : 0}</strong></li>
            <li><span>Safety escalations</span><strong>0</strong></li>
          </ul>
          <p className="privacy-note"><ShieldCheck size={18} aria-hidden="true" /> Aggregate operations only. No learner ranking or prediction.</p>
        </section>
      </div>
    </PortalChrome>
  );
}
