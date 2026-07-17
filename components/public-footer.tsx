import type { Locale } from "@prisma/client";
import Link from "next/link";

import { copy } from "@/lib/i18n";

export function PublicFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="public-footer">
      <div className="page-shell public-footer-inner">
        <p>
          {copy(locale, {
            en: "Kanni helps a school turn one learning goal into coordinated support.",
            ml: "ഒരു പഠനലക്ഷ്യത്തെ ഏകോപിത പിന്തുണയാക്കി മാറ്റാൻ കണ്ണി സ്കൂളിനെ സഹായിക്കുന്നു.",
          })}
        </p>
        <nav aria-label="Legal">
          <Link href="/privacy">
            {copy(locale, { en: "Privacy", ml: "സ്വകാര്യത" })}
          </Link>
          <Link href="/terms">
            {copy(locale, { en: "Terms", ml: "നിബന്ധനകൾ" })}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
