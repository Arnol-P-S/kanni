"use client";

import Link from "next/link";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  void error;

  return (
    <main id="main-content" className="page-shell system-state-page">
      <section className="system-state-card" aria-labelledby="error-title">
        <ShieldAlert size={40} aria-hidden="true" />
        <p className="eyebrow">Temporary problem</p>
        <h1 id="error-title">This page could not finish loading.</h1>
        <p>Your saved learning cycle remains in Kanni. Try the page again, or return home.</p>
        <div className="hero-actions">
          <button className="button primary" type="button" onClick={unstable_retry}>
            <RefreshCw size={18} aria-hidden="true" /> Try again
          </button>
          <Link className="button secondary" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
