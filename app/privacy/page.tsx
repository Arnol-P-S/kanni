import type { Metadata } from "next";
import Link from "next/link";
import {
  Database,
  ExternalLink,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "What the Kanni concept demo stores, does not collect, and would require before supervised AI can be enabled.",
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="page-shell trust-page legal-page">
      <div className="trust-hero">
        <div>
          <p className="eyebrow">Prototype privacy notice · July 17, 2026</p>
          <h1>Privacy starts with collecting less</h1>
          <p>
            Kanni uses synthetic profiles and a signed same-device workspace. Do
            not enter a real learner&apos;s identity, contact details, health
            information, school, location, or private story.
          </p>
        </div>
        <LockKeyhole size={70} aria-hidden="true" />
      </div>

      <section className="trust-section" aria-labelledby="current-state-title">
        <div className="trust-section-heading">
          <ShieldCheck aria-hidden="true" />
          <div>
            <p className="eyebrow">Current release</p>
            <h2 id="current-state-title">Every role works without a model</h2>
          </div>
        </div>
        <p>
          Optional AI is off by default. Admin mapping, teacher planning,
          student activity support, teacher review, and the parent home activity
          all use project-authored content without a model provider.
        </p>
        <p>
          The $100 Build Week credit approved for Codex does not fund API calls
          made by this application. A future model path needs separate API
          funding and a fresh privacy and provider review. The configured
          OpenRouter path must not be enabled for real learner use.
        </p>
      </section>

      <section className="trust-section" aria-labelledby="device-data-title">
        <div className="trust-section-heading">
          <Database aria-hidden="true" />
          <div>
            <p className="eyebrow">Same-device record</p>
            <h2 id="device-data-title">What this browser receives</h2>
          </div>
        </div>
        <div className="trust-grid">
          <article>
            <h3>Stored in signed cookies</h3>
            <ul>
              <li>synthetic persona ID and two-hour session expiry</li>
              <li>synthetic support-circle relationship mapping</li>
              <li>fixed answer and explanation option IDs</li>
              <li>support use, teacher plan and review state, and selected strategy</li>
              <li>one bounded parent response and family language preference</li>
            </ul>
          </article>
          <article>
            <h3>Not stored in the local learning record</h3>
            <ul>
              <li>learner name, account, school, or location</li>
              <li>phone number, email address, or home address</li>
              <li>health information or a private disclosure</li>
              <li>custom question or model transcript</li>
              <li>score, rank, diagnosis, or inferred ability</li>
            </ul>
          </article>
        </div>
        <p>
          The workspace cookie is signed so changed values are rejected, but it
          is still held by the browser and is not encrypted learner storage.
          Kanni has no account database. Ending the synthetic session removes
          both demo cookies.
        </p>
      </section>

      <section className="trust-section" aria-labelledby="server-data-title">
        <div className="trust-section-heading">
          <LockKeyhole aria-hidden="true" />
          <div>
            <p className="eyebrow">Server boundary</p>
            <h2 id="server-data-title">API and log handling</h2>
          </div>
        </div>
        <ul>
          <li>
            The application has no analytics SDK and its code does not log
            request bodies.
          </li>
          <li>
            API responses use <code>Cache-Control: no-store</code>.
          </li>
          <li>
            A direct caller can send a request body to the retained public tutor route.
            Kanni reads at most 8 KiB to validate and classify it. While AI is
            off, the application does not persist, echo, or forward that body
            to a model provider. The revised role workflow uses Server Actions
            with session, role, and relationship checks.
          </li>
          <li>
            The health route reports public capability booleans and reason
            codes. It does not return secret values.
          </li>
          <li>
            Hosting infrastructure may still create operational logs under the
            host&apos;s own terms. Do not enter real personal data.
          </li>
          <li>
            External links leave Kanni and are covered by the destination
            site&apos;s privacy terms.
          </li>
        </ul>
      </section>

      <section className="trust-section" aria-labelledby="future-ai-title">
        <div className="trust-section-heading">
          <TriangleAlert aria-hidden="true" />
          <div>
            <p className="eyebrow">Optional supervised AI</p>
            <h2 id="future-ai-title">What an enabled action sends</h2>
          </div>
        </div>
        <p>
          If an adult operator explicitly configures the OpenRouter path, Kanni
          sends a fixed instruction and the bundled Kanni fractions context to
          draft a teacher plan or visual support. It does not send the synthetic
          person&apos;s name, chosen answer, family response, workspace cookie, or
          a free-text learner prompt. The server requests an Azure-only Zero
          Data Retention route, denies provider data collection, and disables
          provider fallback and automatic application retries.
        </p>
        <p>
          Those technical settings do not replace a legal, provider, and
          deployment review. Real-child data and real-child testing remain
          outside this prototype. The verified release path keeps optional AI
          disabled and uses the same reviewed fallback after any provider error.
        </p>
        <p>
          Read the official{" "}
          <a href="https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance">
            OpenAI Under 18 API Guidance{" "}
            <ExternalLink size={15} aria-hidden="true" />
          </a>{" "}
          and{" "}
          <a href="https://openrouter.ai/docs/guides/features/zdr">
            OpenRouter Zero Data Retention controls{" "}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
          .
        </p>
      </section>

      <section className="trust-section limits-section" aria-labelledby="choices-title">
        <div className="trust-section-heading">
          <ShieldCheck aria-hidden="true" />
          <div>
            <p className="eyebrow">Your choices</p>
            <h2 id="choices-title">Use the demo without personal data</h2>
          </div>
        </div>
        <ul>
          <li>Use only the supplied synthetic profiles.</li>
          <li>Choose fixed lesson questions instead of entering free text.</li>
          <li>Use Switch demo account or Reset synthetic workspace to remove the signed demo state.</li>
          <li>Stop using the prototype if its limits do not fit your use.</li>
        </ul>
        <div className="hero-actions">
          <Link className="button primary" href="/trust">
            Read Trust and limitations
          </Link>
          <Link className="button secondary" href="/terms">
            Read prototype terms
          </Link>
        </div>
      </section>
    </main>
  );
}
