import { Locale } from "@prisma/client";
import { Languages } from "lucide-react";

import { setLocaleAction } from "@/app/actions/preferences";

export function LanguageSwitcher({
  locale,
  returnTo,
}: {
  locale: Locale;
  returnTo: string;
}) {
  return (
    <form action={setLocaleAction} className="language-switch" aria-label="Language">
      <input type="hidden" name="returnTo" value={returnTo} />
      <Languages size={18} aria-hidden="true" />
      <button
        type="submit"
        name="locale"
        value={Locale.en}
        aria-pressed={locale === Locale.en}
      >
        English
      </button>
      <button
        type="submit"
        name="locale"
        value={Locale.ml}
        aria-pressed={locale === Locale.ml}
        lang="ml"
      >
        മലയാളം
      </button>
    </form>
  );
}
