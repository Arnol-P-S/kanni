import type { Locale } from "@prisma/client";
import { LogIn } from "lucide-react";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { NodesMark } from "@/components/nodes-mark";
import { copy } from "@/lib/i18n";

export function PublicHeader({
  locale,
  returnTo,
}: {
  locale: Locale;
  returnTo: string;
}) {
  return (
    <header className="public-header">
      <a className="skip-link" href="#main-content">
        {copy(locale, { en: "Skip to content", ml: "ഉള്ളടക്കത്തിലേക്ക് കടക്കുക" })}
      </a>
      <div className="page-shell public-header-inner">
        <Link className="brand" href="/" aria-label="Kanni home">
          <NodesMark className="brand-mark" />
          <span>
            <strong>Kanni</strong>
            <span lang="ml">കണ്ണി</span>
          </span>
        </Link>
        <div className="public-header-actions">
          <LanguageSwitcher locale={locale} returnTo={returnTo} />
          <Link className="button compact primary" href="/login">
            <LogIn size={17} aria-hidden="true" />
            {copy(locale, { en: "Sign in", ml: "സൈൻ ഇൻ" })}
          </Link>
        </div>
      </div>
    </header>
  );
}
