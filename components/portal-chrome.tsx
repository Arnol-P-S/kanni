import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import {
  resetDemoWorkspace,
  switchDemoAccount,
} from "@/app/actions/demo";
import type { ActorContext } from "@/lib/demo-authorization";
import { demoPersonas, type DemoPersonaId } from "@/lib/demo-fixtures";
import type { GrowthCycle } from "@/lib/growth-cycle";

const roleLabels = {
  tenant_admin: "Admin view",
  teacher: "Teacher view",
  student: "Student view",
  guardian: "Parent view",
} as const;

function cycleStage(cycle: GrowthCycle): string {
  if (cycle.family.response !== "not_sent") return "Family response received";
  if (cycle.teacherReview.familyBriefApproved) return "Family activity ready";
  if (cycle.student.revisedAnswer) return "Evidence ready for teacher review";
  if (cycle.student.firstAnswer) return "Student support in progress";
  if (cycle.plan.status === "published") return "Student activity ready";
  if (cycle.mapping.teacherAssigned) return "Teacher plan ready";
  return "Support circle needs mapping";
}

export function PortalChrome({
  actor,
  cycle,
  title,
  intro,
  children,
}: {
  actor: ActorContext;
  cycle: GrowthCycle;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const persona = demoPersonas[actor.personaId as DemoPersonaId];
  return (
    <main id="main-content" className="page-shell portal-page">
      <aside className="demo-ribbon" aria-label="Demo disclosure">
        <ShieldCheck size={19} aria-hidden="true" />
        <span>
          Synthetic demo workspace. No real account, learner, school, or family
          data.
        </span>
      </aside>

      <header className="portal-heading">
        <div>
          <p className="eyebrow">{roleLabels[actor.role]} · {persona.displayName}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <div className="portal-actions">
          <form action={switchDemoAccount}>
            <button className="button secondary" type="submit">
              <ArrowLeftRight size={18} aria-hidden="true" />
              Switch demo account
            </button>
          </form>
          {actor.role === "tenant_admin" ? (
            <form action={resetDemoWorkspace}>
              <button className="button quiet" type="submit">
                <RotateCcw size={18} aria-hidden="true" />
                Reset cycle
              </button>
            </form>
          ) : null}
        </div>
      </header>

      <section className="cycle-strip" aria-label="Shared learning cycle status">
        <div>
          <span>Shared learning goal</span>
          <strong>Compare one half and one quarter</strong>
        </div>
        <div>
          <span>Current handoff</span>
          <strong>{cycleStage(cycle)}</strong>
        </div>
        <Link href="/trust">How this demo handles trust</Link>
      </section>

      {children}
    </main>
  );
}

export function WaitingCard({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <section className="portal-card waiting-card">
      <p className="eyebrow">Waiting for the previous handoff</p>
      <h2>{title}</h2>
      <p>{detail}</p>
    </section>
  );
}
