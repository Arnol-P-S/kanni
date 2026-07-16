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
import deterministicResults from "@/eval/deterministic-results.json";
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
const deterministicRunDate = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "long",
  timeZone: "Asia/Kolkata",
}).format(new Date(deterministicResults.runDate));

export default function TrustPage() {
  return (
    <main id="main-content" className="page-shell trust-page">
      <div className="trust-hero">
        <div>
          <p className="eyebrow">Trust center · Prototype evidence</p>
          <h1>What Kanni uses, what it stores, and where it stops</h1>
          <p>
            This page separates working product behavior from plans and open
            review items. The current release connects four synthetic roles
            around one fractions learning goal. Optional AI is off by default,
            and every role can complete its work with project-authored content.
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
          The fractions learning cycle and the two retained lesson packs are
          original Kanni content under CC BY 4.0.
          Public SCERT pages are link-only references. Kanni does not copy,
          index, transcribe, screenshot, redraw, or redistribute textbook
          content or logos.
        </p>
        <p>
          Two third-party pages shared during planning list textbooks and
          handbooks: the{" "}
          <a href="https://www.arabiceduweb.in/2024/06/1-3-new-text-books-2024.html">
            handbook listing <ExternalLink size={15} aria-hidden="true" />
          </a>{" "}
          and the{" "}
          <a href="https://www.arabiceduweb.in/2024/05/i-iii-v-vii-ix-new-text-books-2024.html">
            textbook listing <ExternalLink size={15} aria-hidden="true" />
          </a>
          . They are discovery links, not lesson sources. Kanni does not ingest
          or republish their content.
        </p>
        <div className="table-wrap" tabIndex={0} aria-label="Scrollable source registry">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Use</th>
                <th>Rights basis</th>
                <th>Source record version</th>
                <th>External content review</th>
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
        <p>
          The fixed content is project-authored. Independent Kerala-teacher and
          native-Malayalam reviews are still pending, so Malayalam remains
          preview.
        </p>
      </section>

      <section id="privacy" className="trust-section" aria-labelledby="privacy-title">
        <div className="trust-section-heading">
          <LockKeyhole aria-hidden="true" />
          <div>
            <p className="eyebrow">Privacy and minors</p>
            <h2 id="privacy-title">Signed synthetic sessions and minimum data</h2>
          </div>
        </div>
        <div className="trust-grid">
          <article>
            <h3>Stored in signed same-device cookies</h3>
            <ul className="check-list">
              <li><CheckCircle2 aria-hidden="true" />Synthetic persona ID and a two-hour adult-operated session</li>
              <li><CheckCircle2 aria-hidden="true" />Synthetic teacher, student, and guardian relationship mapping</li>
              <li><CheckCircle2 aria-hidden="true" />Plan state, fixed activity choices, support use, teacher review, and a bounded family response</li>
            </ul>
          </article>
          <article>
            <h3>Not stored in the learning record</h3>
            <ul className="check-list">
              <li><CheckCircle2 aria-hidden="true" />Learner name, account, school, or location</li>
              <li><CheckCircle2 aria-hidden="true" />Phone, email, health, or contact information</li>
              <li><CheckCircle2 aria-hidden="true" />Raw learner prompt, model transcript, analytics, score, or rank</li>
            </ul>
          </article>
        </div>
        <p>
          The synthetic login is not proof of identity. Its HMAC signature stops
          casual cookie editing from becoming trusted state, but there is no
          database, school SSO, password, or production account recovery. The
          relationship check matters as much as the role check: Arun can read
          only Diya&apos;s approved family brief, and admin receives aggregate
          operational counts rather than the learner&apos;s explanation. Real-child
          testing and real child personal data are excluded from this prototype.
          See the official{" "}
          <a href="https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance">
            OpenAI Under 18 API Guidance
          </a>
          . Read the separate <Link href="/privacy">privacy notice</Link> and{" "}
          <Link href="/terms">prototype terms</Link>.
        </p>
      </section>

      <section id="ai" className="trust-section" aria-labelledby="ai-title">
        <div className="trust-section-heading">
          <BookOpenCheck aria-hidden="true" />
          <div>
            <p className="eyebrow">Optional provider state</p>
            <h2 id="ai-title">OpenRouter is bounded and off by default</h2>
          </div>
        </div>
        <div
          className="runtime-flow"
          aria-label="Scrollable tutor request validation flow"
          tabIndex={0}
        >
          <span>Fixed workflow action</span>
          <b>→</b>
          <span>Role and relationship checks</span>
          <b>→</b>
          <span>Capability check</span>
          <b>→</b>
          <span>OpenRouter policy route</span>
          <b>→</b>
          <span>Project-authored fallback</span>
        </div>
        <div className="trust-grid runtime-cards">
          <article>
            <span className="status-dot pending" />
            <h3>Safe default</h3>
            <p>
              <code>GROWTH_AI_PROVIDER=disabled</code> and
              <code> AI_DEMO_ENABLED=false</code> keep model calls off. Teacher
              planning and student support remain complete.
            </p>
          </article>
          <article>
            <span className="status-dot pending" />
            <h3>When explicitly enabled</h3>
            <p>
              The server uses OpenRouter with one configured GPT-5.6 Sol model,
              an Azure-only Zero Data Retention route, provider data collection
              denied, fallbacks disabled, no automatic retry, short output
              limits, and an 18-second timeout.
            </p>
          </article>
          <article>
            <span className="status-dot pending" />
            <h3>Application-controlled workflow</h3>
            <p>
              There is no recursive agent loop. AI may draft a structured teacher
              plan or one teacher-selected support. Zod validates the result,
              and student-facing prose must pass a strategy-specific content
              gate. Any provider, schema, or content failure returns reviewed
              Kanni content.
            </p>
          </article>
        </div>
        <p>
          The approved $100 Codex credit pays for work inside Codex. It cannot
          pay for application API requests. OpenRouter needs its own budget and
          key, which are never exposed to the browser. Do not enable model calls
          until the selected route, provider terms, retention controls, and
          deployment rate limits are reviewed for the intended audience. See
          the <a href="https://openrouter.ai/docs/guides/routing/provider-selection">OpenRouter provider-routing documentation</a>{" "}
          and <a href="https://openrouter.ai/docs/guides/features/zdr">Zero Data Retention documentation</a>.
        </p>
      </section>

      <section id="evals" className="trust-section" aria-labelledby="evals-title">
        <div className="trust-section-heading">
          <FileCheck2 aria-hidden="true" />
          <div>
            <p className="eyebrow">Eval specification</p>
            <h2 id="evals-title">{evalCases.length} release cases in the repository</h2>
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
          <span className="review-badge approved">
            {deterministicResults.totals.passed} / {deterministicResults.totals.total} deterministic
          </span>
          <p>
            Deterministic request and safety routing passed on {deterministicRunDate}{" "}
            with prompt version {deterministicResults.promptVersion} and lesson-pack
            versions {deterministicResults.lessonPackVersions.join(" and ")}. This
            run made no model calls and did not measure model quality.
            Live model pass rates, an exact model snapshot, and known failures
            have not been published. No live model run is claimed on this page.
          </p>
        </div>
        <h3>Release thresholds</h3>
        <ul className="check-list columns">
          <li><Circle aria-hidden="true" />Target: every supported case selects the expected lesson and valid section IDs</li>
          <li><Circle aria-hidden="true" />Target: at least 11 of the original 12 supported cases pass human clarity, age-fit, and teaching checks</li>
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
          <li>The revised judge path demonstrates one fractions goal across admin, teacher, student, and parent roles.</li>
          <li>The earlier Class 1 addition and Class 11 linear-search slices remain available as secondary project-authored examples.</li>
          <li>No claim is made about improved academic performance or statewide readiness.</li>
          <li>The signed synthetic session demonstrates role and relationship authorization. It is not production authentication.</li>
          <li>No database, school integration, registration, password reset, tenant provisioning, or real identity verification exists.</li>
          <li>Teacher, parent, and native Malayalam reviews are still pending.</li>
          <li>Optional OpenRouter calls have not been live-tested in this release. The reviewed fallback is the verified path.</li>
          <li>A separate API budget, provider review, host rate limits, deployment, and live model eval evidence remain pending.</li>
        </ul>
        <Link className="button primary" href="/">
          Return to the concept demo
        </Link>
      </section>
    </main>
  );
}
