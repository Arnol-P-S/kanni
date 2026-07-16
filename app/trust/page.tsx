import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { evalCases } from "@/eval/cases";
import { sourceRegistry } from "@/lib/lessons";

export const metadata: Metadata = {
  title: "Trust, safety, and sources",
  description:
    "Kanni's content rights, privacy boundaries, AI validation, evaluation plan, and known limits.",
};

const categoryCounts = evalCases.reduce<Record<string, number>>(
  (counts, item) => ({
    ...counts,
    [item.category]: (counts[item.category] ?? 0) + 1,
  }),
  {},
);

export default function TrustPage() {
  return (
    <main id="main-content" className="page-shell trust-page">
      <div className="trust-hero">
        <div>
          <p className="eyebrow">Trust center · Prototype evidence</p>
          <h1>What Kanni uses, what it stores, and where it stops</h1>
          <p>
            This page separates working product behavior from plans and open
            review items. The safest default is static, reviewed lesson content.
          </p>
        </div>
        <ShieldCheck size={70} aria-hidden="true" />
      </div>

      <nav className="trust-nav" aria-label="Trust page sections">
        <a href="#sources">Sources and rights</a>
        <a href="#privacy">Privacy and minors</a>
        <a href="#ai">AI boundaries</a>
        <a href="#evals">Evaluation</a>
        <a href="#limits">Limits</a>
      </nav>

      <section id="sources" className="trust-section" aria-labelledby="sources-title">
        <div className="trust-section-heading">
          <FileCheck2 aria-hidden="true" />
          <div>
            <p className="eyebrow">Content registry</p>
            <h2 id="sources-title">Only rights-cleared content is ingested</h2>
          </div>
        </div>
        <p>
          The two lesson packs are original Kanni content under CC BY 4.0.
          Public SCERT pages are link-only references. Kanni does not copy,
          index, transcribe, screenshot, redraw, or redistribute textbook
          content or logos.
        </p>
        <div className="table-wrap" tabIndex={0} aria-label="Scrollable source registry">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Use</th>
                <th>Rights basis</th>
                <th>Version</th>
                <th>Human review</th>
              </tr>
            </thead>
            <tbody>
              {sourceRegistry.map((source) => (
                <tr key={source.id}>
                  <td>
                    {source.url ? (
                      <a href={source.url}>
                        {source.title} <ExternalLink size={15} aria-hidden="true" />
                      </a>
                    ) : (
                      source.title
                    )}
                    <small>{source.author}</small>
                  </td>
                  <td>{source.usage.replace("_", " ")}</td>
                  <td>{source.rightsBasis.replaceAll("_", " ")}</td>
                  <td>{source.version}</td>
                  <td>{source.reviewedAt ? "Completed" : "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="non-affiliation">
          <TriangleAlert size={21} aria-hidden="true" />
          <p>
            Kanni is an independent OpenAI Build Week prototype. It is not
            affiliated with or endorsed by SCERT Kerala or the Government of
            Kerala. “SCERT-aligned” is not claimed until a Kerala teacher has
            reviewed the mapping.
          </p>
        </div>
      </section>

      <section id="privacy" className="trust-section" aria-labelledby="privacy-title">
        <div className="trust-section-heading">
          <LockKeyhole aria-hidden="true" />
          <div>
            <p className="eyebrow">Privacy and minors</p>
            <h2 id="privacy-title">Synthetic profiles and an adult gate</h2>
          </div>
        </div>
        <div className="trust-grid">
          <article>
            <h3>Stored on this device</h3>
            <ul className="check-list">
              <li><CheckCircle2 aria-hidden="true" />Answer option IDs and correctness</li>
              <li><CheckCircle2 aria-hidden="true" />Hint use and activity observation</li>
              <li><CheckCircle2 aria-hidden="true" />Teacher review state and strategy</li>
            </ul>
          </article>
          <article>
            <h3>Not collected by Kanni</h3>
            <ul className="check-list">
              <li><CheckCircle2 aria-hidden="true" />Learner name, account, school, or location</li>
              <li><CheckCircle2 aria-hidden="true" />Phone, email, health, or contact information</li>
              <li><CheckCircle2 aria-hidden="true" />Custom prompt, transcript, analytics, or rank</li>
            </ul>
          </article>
        </div>
        <p>
          AI requests require the signed, short-lived adult confirmation cookie.
          Requests go through Vercel AI Gateway to the model provider and may be
          subject to provider safety-monitoring retention. Setting `store: false`
          is not the same as Zero Data Retention, so real-child testing and real
          child personal data are excluded from this prototype. See the official{" "}
          <a href="https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance">
            OpenAI Under 18 API Guidance
          </a>.
        </p>
      </section>

      <section id="ai" className="trust-section" aria-labelledby="ai-title">
        <div className="trust-section-heading">
          <BookOpenCheck aria-hidden="true" />
          <div>
            <p className="eyebrow">GPT-5.6 runtime</p>
            <h2 id="ai-title">A bounded lesson workflow, not an open agent</h2>
          </div>
        </div>
        <div
          className="runtime-flow"
          aria-label="Scrollable tutor request validation flow"
          tabIndex={0}
        >
          <span>Adult cookie</span>
          <b>→</b>
          <span>Input and safety checks</span>
          <b>→</b>
          <span>One lesson pack</span>
          <b>→</b>
          <span>GPT-5.6 Sol</span>
          <b>→</b>
          <span>Zod and ID validation</span>
        </div>
        <div className="trust-grid runtime-cards">
          <article>
            <span className="status-dot configured" />
            <h3>Primary tutor</h3>
            <p>
              `openai/gpt-5.6-sol`, at most 600 output tokens, 18-second
              timeout, no automatic retry, no tools, and no response chaining.
            </p>
          </article>
          <article>
            <span className="status-dot configured" />
            <h3>Optional Deep Check</h3>
            <p>
              Two `openai/gpt-5.6-luna` critics run with `Promise.allSettled`.
              A critic failure never removes an already validated tutor answer.
            </p>
          </article>
          <article>
            <span className="status-dot pending" />
            <h3>Human review</h3>
            <p>
              AI answers show `pending`. Reviewed static answers show
              `completed`. Malayalam remains preview until native-speaker review.
            </p>
          </article>
        </div>
        <p>
          Any refusal, provider error, timeout, malformed object, unknown lesson
          ID, unknown check ID, or unknown confusion code hides the generated
          text. The interface falls back to reviewed content or an unavailable
          message.
        </p>
      </section>

      <section id="evals" className="trust-section" aria-labelledby="evals-title">
        <div className="trust-section-heading">
          <FileCheck2 aria-hidden="true" />
          <div>
            <p className="eyebrow">Eval specification v1.0.0</p>
            <h2 id="evals-title">32 cases defined before tutor logic</h2>
          </div>
        </div>
        <div className="scorecard-grid">
          <article><strong>{evalCases.length}</strong><span>Total cases</span></article>
          <article><strong>{categoryCounts.supported}</strong><span>Supported lesson cases</span></article>
          <article><strong>{categoryCounts.injection}</strong><span>Injection and cheating</span></article>
          <article><strong>{categoryCounts.safety}</strong><span>Safety routes</span></article>
          <article><strong>{categoryCounts.personal_data}</strong><span>Personal-data checks</span></article>
          <article><strong>10+</strong><span>Malayalam mixing or variations</span></article>
        </div>
        <div className="eval-status">
          <span className="review-badge approved">32 / 32 preflight</span>
          <p>
            Deterministic routing passed on July 16, 2026 with prompt version
            tutor-v1.0.0 and content versions math-1.0.0 and cs-1.0.0. Live
            model pass rates, exact model snapshot, and known failures are not
            published until a budgeted Gateway run is completed. No live run is
            claimed on this page.
          </p>
        </div>
        <h3>Release thresholds</h3>
        <ul className="check-list columns">
          <li><Circle aria-hidden="true" />Target: 12 of 12 supported cases select the expected lesson and valid section IDs</li>
          <li><Circle aria-hidden="true" />Target: at least 11 of 12 pass human clarity, age-fit, and teaching checks</li>
          <li><Circle aria-hidden="true" />Target: all unsupported cases abstain</li>
          <li><Circle aria-hidden="true" />Target: safety, injection, and personal-data cases have zero serious failures across three runs</li>
        </ul>
      </section>

      <section id="limits" className="trust-section limits-section" aria-labelledby="limits-title">
        <div className="trust-section-heading">
          <TriangleAlert aria-hidden="true" />
          <div>
            <p className="eyebrow">Known limits</p>
            <h2 id="limits-title">A concept demo, not a school product</h2>
          </div>
        </div>
        <ul>
          <li>Only Class 1 addition within 10 and Class 11 linear search are implemented.</li>
          <li>No claim is made about improved academic performance or statewide readiness.</li>
          <li>No real authentication, database, school integration, or role-based access exists.</li>
          <li>Teacher, parent, and native Malayalam reviews are still pending.</li>
          <li>Gateway budgets, WAF rate limits, deployment, and live eval evidence require external setup.</li>
        </ul>
        <Link className="button primary" href="/">
          Return to the concept demo
        </Link>
      </section>
    </main>
  );
}
