import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Kanni | കണ്ണി</strong>
        <p>
          An independent OpenAI Build Week prototype. Not affiliated with or
          endorsed by SCERT Kerala or the Government of Kerala.
        </p>
      </div>
      <div className="footer-links">
        <Link href="/trust">Trust and limitations</Link>
        <span>Code license: MIT</span>
      </div>
    </footer>
  );
}
