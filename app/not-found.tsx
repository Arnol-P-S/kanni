import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" className="page-shell system-state-page">
      <section className="system-state-card" aria-labelledby="not-found-title">
        <Map size={40} aria-hidden="true" />
        <p className="eyebrow">Page not found</p>
        <h1 id="not-found-title">This Kanni path is not part of the demo.</h1>
        <p>
          The Build Week version includes two lessons and the connected teacher,
          parent, and Trust views.
        </p>
        <Link className="button primary" href="/">
          <ArrowLeft size={18} aria-hidden="true" /> See the implemented lessons
        </Link>
      </section>
    </main>
  );
}
