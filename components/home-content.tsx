"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  House as HomeIcon,
  School,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

import { NodesMark } from "@/components/nodes-mark";

const roleProblems = [
  {
    title: "Student",
    detail:
      "Try first, ask for another explanation, explain your thinking, and question an inaccurate record.",
    icon: BookOpenCheck,
  },
  {
    title: "Teacher",
    detail:
      "Plan, differentiate, anticipate misconceptions, review evidence, and approve family support.",
    icon: School,
  },
  {
    title: "Parent",
    detail:
      "Understand the current goal, try one short home activity, and return a useful signal.",
    icon: HomeIcon,
  },
  {
    title: "Admin",
    detail:
      "Map trusted relationships, set policy, and monitor handoffs without ranking learners.",
    icon: UserRoundCog,
  },
] as const;

export function HomeContent() {
  return (
    <main id="main-content">
      <section className="hero page-shell revised-hero">
        <div className="hero-copy">
          <p className="eyebrow">OpenAI Build Week · Education</p>
          <h1>
            One learning goal.
            <span>Four people moving it forward.</span>
          </h1>
          <p className="hero-lead">
            Kanni connects the student, teacher, parent, and school around one
            reviewed next step. Each person sees only the part they need.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/login">
              Enter the four-role demo
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link className="button secondary" href="/trust">
              Read the safety boundaries
            </Link>
          </div>
          <p className="disclosure">
            Adult-operated synthetic profiles only. No real school, learner,
            or family information is used.
          </p>
        </div>
        <div
          className="hero-visual support-circle-visual"
          aria-label="Student, teacher, parent, and admin connected by one growth cycle"
        >
          <NodesMark className="hero-mark" />
          <div className="role-orbit student-orbit"><BookOpenCheck aria-hidden="true" /><span>Student</span></div>
          <div className="role-orbit teacher-orbit"><School aria-hidden="true" /><span>Teacher</span></div>
          <div className="role-orbit parent-orbit"><HomeIcon aria-hidden="true" /><span>Parent</span></div>
          <div className="role-orbit admin-orbit"><UserRoundCog aria-hidden="true" /><span>Admin</span></div>
          <p className="hero-visual-caption">One shared GrowthCycle</p>
        </div>
      </section>

      <section className="page-shell section-block" aria-labelledby="cycle-title">
        <div className="section-heading">
          <p className="eyebrow">The learning support cycle</p>
          <h2 id="cycle-title">Every handoff changes what happens next</h2>
          <p>
            The demo follows one original fraction goal. It is specific enough
            to test and general enough to show the future product structure.
          </p>
        </div>
        <ol className="loop-grid revised-loop">
          {[
            ["01", "Admin maps", "A trusted teacher, learner, guardian, and language preference are connected."],
            ["02", "Teacher publishes", "The teacher reviews a plan, misconceptions, supports, and a quick check."],
            ["03", "Student explains", "The learner attempts, opens support, retries, and explains the choice."],
            ["04", "Family responds", "A reviewed home activity returns one bounded signal to the teacher."],
          ].map(([number, title, detail]) => (
            <li key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{detail}</p></li>
          ))}
        </ol>
      </section>

      <section className="role-problems-section">
        <div className="page-shell">
          <div className="section-heading">
            <p className="eyebrow">Different work, shared purpose</p>
            <h2>Each role gets one clear next task</h2>
          </div>
          <div className="role-problem-grid">
            {roleProblems.map(({ title, detail, icon: Icon }) => (
              <article key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell trust-callout">
        <ShieldCheck size={28} aria-hidden="true" />
        <div>
          <h2>A community without a public social network</h2>
          <p>
            No public profiles, follower graph, leaderboard, open chat, direct
            student messaging, or automated diagnosis. Community means a
            private support circle around one learning goal.
          </p>
        </div>
        <Link className="text-link" href="/login">
          Start with Admin <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
