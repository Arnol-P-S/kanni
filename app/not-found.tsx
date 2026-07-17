import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" className="page-shell system-state-page">
      <section className="system-state-card" aria-labelledby="not-found-title">
        <Map size={40} aria-hidden="true" />
        <p className="eyebrow">Page not found</p>
        <h1 id="not-found-title">This Kanni page does not exist.</h1>
        <p>Return to Kanni and open the workspace connected to your school account.</p>
        <Link className="button primary" href="/">
          <ArrowLeft size={18} aria-hidden="true" /> Return to Kanni
        </Link>
      </section>
    </main>
  );
}
