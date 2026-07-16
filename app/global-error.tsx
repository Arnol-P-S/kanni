"use client";

import Link from "next/link";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  void error;

  return (
    <html lang="en">
      <head>
        <title>Kanni needs another try</title>
      </head>
      <body>
        <main id="main-content" className="page-shell system-state-page">
          <section className="system-state-card" aria-labelledby="global-error-title">
            <ShieldAlert size={40} aria-hidden="true" />
            <p className="eyebrow">Temporary problem</p>
            <h1 id="global-error-title">Kanni needs another try.</h1>
            <p>
              No learner identity or conversation is stored by this prototype.
              Reload the app, or return to the home page.
            </p>
            <div className="hero-actions">
              <button className="button primary" type="button" onClick={unstable_retry}>
                <RefreshCw size={18} aria-hidden="true" /> Reload Kanni
              </button>
              <Link className="button secondary" href="/">
                Return home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
