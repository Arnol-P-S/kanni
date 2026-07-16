import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  FileText,
  Scale,
  ShieldAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Prototype terms",
  description:
    "Terms for testing the Kanni OpenAI Build Week concept demo.",
};

export default function TermsPage() {
  return (
    <main id="main-content" className="page-shell trust-page legal-page">
      <div className="trust-hero">
        <div>
          <p className="eyebrow">Prototype terms · July 17, 2026</p>
          <h1>Terms for testing Kanni</h1>
          <p>
            Kanni is an early, free concept demo. Use it only with synthetic
            profiles and within the two implemented lessons.
          </p>
        </div>
        <FileText size={70} aria-hidden="true" />
      </div>

      <section className="trust-section" aria-labelledby="agreement-title">
        <div className="trust-section-heading">
          <Scale aria-hidden="true" />
          <div>
            <p className="eyebrow">Using this demo</p>
            <h2 id="agreement-title">What you agree to</h2>
          </div>
        </div>
        <ul>
          <li>You are testing an independent prototype, not a school service.</li>
          <li>
            You will not enter a real child&apos;s name, school, location, contact
            detail, health information, persistent identifier, or private story.
          </li>
          <li>
            You will not use Kanni to grade, rank, diagnose, supervise, or make
            an academic, career, welfare, or emergency decision.
          </li>
          <li>
            You will not try to extract secrets, hidden prompts, answer keys, or
            content that Kanni has no right to provide.
          </li>
          <li>
            You understand that the signed synthetic sessions demonstrate role
            and relationship rules. They are not identity proof, school SSO, or
            production accounts.
          </li>
        </ul>
      </section>

      <section className="trust-section" aria-labelledby="not-service-title">
        <div className="trust-section-heading">
          <ShieldAlert aria-hidden="true" />
          <div>
            <p className="eyebrow">Limits</p>
            <h2 id="not-service-title">What Kanni is not</h2>
          </div>
        </div>
        <div className="trust-grid">
          <article>
            <h3>Not educational evidence</h3>
            <p>
              An activity event does not prove learning improvement, ability,
              curriculum coverage, or readiness for a class, stream, or career.
            </p>
          </article>
          <article>
            <h3>Not safety or professional support</h3>
            <p>
              Kanni is not a counsellor, emergency service, safeguarding system,
              teacher, doctor, lawyer, or other professional adviser.
            </p>
          </article>
        </div>
        <p>
          If anyone is in immediate danger in India, call 112. Children can call
          Child Helpline at 1098. Tele-MANAS is available at 14416 for mental-health
          support. Kanni does not call these services or contact another person
          for you.
        </p>
      </section>

      <section className="trust-section" aria-labelledby="ai-title">
        <div className="trust-section-heading">
          <BookOpenCheck aria-hidden="true" />
          <div>
            <p className="eyebrow">Optional capability</p>
            <h2 id="ai-title">AI is off by default</h2>
          </div>
        </div>
        <p>
          Every role can complete the demo with project-authored content. An
          adult operator may configure OpenRouter for a bounded teacher-plan or
          visual-support draft. Any model output is optional, structured, and
          replaced with reviewed content after a provider or validation failure.
          Do not enable it for real learner use.
        </p>
        <p>
          Codex credits can fund work inside Codex. They do not pay for API calls
          made by this application.
        </p>
      </section>

      <section className="trust-section" aria-labelledby="content-title">
        <div className="trust-section-heading">
          <FileText aria-hidden="true" />
          <div>
            <p className="eyebrow">Content and rights</p>
            <h2 id="content-title">Original lessons and link-only references</h2>
          </div>
        </div>
        <p>
          Kanni application code is available under the MIT license. Original
          Kanni lesson content is licensed separately under CC BY 4.0. External
          textbook and handbook pages are links for human reference only. Kanni
          does not grant rights to content on another site.
        </p>
        <p>
          Kanni is independent. It is not affiliated with or endorsed by SCERT
          Kerala or the Government of Kerala, and it does not claim endorsement
          by the owners of linked third-party sites.
        </p>
      </section>

      <section className="trust-section limits-section" aria-labelledby="availability-title">
        <div className="trust-section-heading">
          <ShieldAlert aria-hidden="true" />
          <div>
            <p className="eyebrow">Availability and changes</p>
            <h2 id="availability-title">The prototype can change or stop</h2>
          </div>
        </div>
        <p>
          The demo is provided as available, without a promise that every answer,
          route, external link, or browser feature will always work. Features may
          be changed, disabled, or removed when safety, rights, cost, or policy
          checks require it. The date at the top shows the version of these terms.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/">
            Return to Kanni
          </Link>
          <Link className="button secondary" href="/privacy">
            Read the privacy notice
          </Link>
        </div>
      </section>
    </main>
  );
}
