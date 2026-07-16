"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Home as HomeIcon,
  School,
  ShieldCheck,
} from "lucide-react";

import { NodesMark } from "@/components/nodes-mark";
import { useLearningRecord } from "@/components/learning-record-provider";

export function HomeContent() {
  const { language } = useLearningRecord();
  const isMalayalam = language === "ml";

  return (
    <main id="main-content">
      <section className="hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow">OpenAI Build Week concept demo</p>
          <h1>
            One learning moment.
            <span>Three useful next steps.</span>
          </h1>
          <p className="hero-lead">
            Kanni turns one learning moment into age-appropriate help for a
            Kerala student, a clear signal for their teacher, and one useful
            next step for their parent.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/learn/class-1/add-within-10">
              Try Class 1 Mathematics
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link
              className="button secondary"
              href="/learn/class-11/linear-search"
            >
              Try Class 11 Computer Science
            </Link>
          </div>
          <p className="disclosure">
            Uses synthetic profiles only. This is a same-device concept demo,
            not an authentication or school access system.
          </p>
        </div>
        <div className="hero-visual" aria-label="Student, teacher, and parent connected by one learning record">
          <NodesMark className="hero-mark" />
          <div className="role-orbit student-orbit">
            <BookOpenCheck aria-hidden="true" />
            <span>Student</span>
          </div>
          <div className="role-orbit teacher-orbit">
            <School aria-hidden="true" />
            <span>Teacher</span>
          </div>
          <div className="role-orbit parent-orbit">
            <HomeIcon aria-hidden="true" />
            <span>Parent</span>
          </div>
          <p className="hero-visual-caption">One local learning record</p>
        </div>
      </section>

      <section className="page-shell section-block" aria-labelledby="learning-loop-title">
        <div className="section-heading">
          <p className="eyebrow">The connected loop</p>
          <h2 id="learning-loop-title">The teacher’s choice reaches the next activity</h2>
          <p>
            The demo is built around one observable loop, not separate role
            dashboards.
          </p>
        </div>
        <ol className="loop-grid">
          {[
            ["01", "Student attempts", "A fixed, age-appropriate activity records only the answer event."],
            ["02", "Kanni helps", "A reviewed hint or grounded answer supports another try."],
            ["03", "Teacher reviews", "The teacher sees activity evidence and selects one bounded strategy."],
            ["04", "Home follows up", "The parent gets one plain-language activity without the learner prompt."],
          ].map(([number, title, detail]) => (
            <li key={number}>
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lesson-section">
        <div className="page-shell">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Two complete lesson slices</p>
              <h2>Start with the learner view</h2>
            </div>
            <p>
              Classes 2 to 10 and Class 12 are roadmap items. They are not
              implemented in this prototype.
            </p>
          </div>
          <div className="lesson-grid">
            <article className="lesson-card younger-card">
              <div className="lesson-card-top">
                <span className="grade-pill">Class 1</span>
                <span className="preview-pill" lang="ml">മലയാളം ആദ്യം</span>
              </div>
              <div className="counter-preview" aria-hidden="true">
                <span />
                <span />
                <b>+</b>
                <span />
                <span />
                <span />
              </div>
              <h3 lang={isMalayalam ? "ml" : "en"}>
                {isMalayalam ? "10-നുള്ളിലെ കൂട്ടൽ" : "Addition within 10"}
              </h3>
              <p>
                Adult-assisted fixed choices, concrete counters, a reviewed
                fallback hint, and a follow-up understanding check.
              </p>
              <Link href="/learn/class-1/add-within-10">
                Open activity <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
            <article className="lesson-card older-card">
              <div className="lesson-card-top">
                <span className="grade-pill">Class 11</span>
                <span className="preview-pill">English first</span>
              </div>
              <div className="trace-preview" aria-label="Linear search checks 4, then finds 7">
                <span className="checked">4</span>
                <span className="found">7</span>
                <span>9</span>
              </div>
              <h3>Linear search and algorithmic thinking</h3>
              <p>
                Reviewed answers work offline. Adult-supervised custom
                questions stay inside one bundled lesson pack.
              </p>
              <Link href="/learn/class-11/linear-search">
                Open activity <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="page-shell trust-callout">
        <ShieldCheck size={28} aria-hidden="true" />
        <div>
          <h2>Built with visible limits</h2>
          <p>
            No real child data, learner accounts, analytics, rankings, or
            copied textbook content. AI output is hidden when its schema or
            source IDs fail validation.
          </p>
        </div>
        <Link className="text-link" href="/trust">
          Read the trust notes <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
