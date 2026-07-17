import type { Metadata } from "next";

import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { copy, getRequestLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Terms" };

export default async function TermsPage() {
  const locale = await getRequestLocale();
  return (
    <>
      <PublicHeader locale={locale} returnTo="/terms" />
      <main id="main-content" className="page-shell legal-page">
        <p className="eyebrow">{copy(locale, { en: "Terms", ml: "നിബന്ധനകൾ" })}</p>
        <h1>{copy(locale, { en: "Kanni supports decisions. People remain responsible for them.", ml: "തീരുമാനങ്ങൾക്ക് കണ്ണി പിന്തുണ നൽകുന്നു. അവയുടെ ഉത്തരവാദിത്തം ആളുകൾക്കാണ്." })}</h1>
        <section><h2>{copy(locale, { en: "Learning support", ml: "പഠനപിന്തുണ" })}</h2><p>{copy(locale, { en: "Kanni helps a school coordinate a learning goal. It does not diagnose a learner, award grades, rank students, select an academic stream, or make a career decision.", ml: "ഒരു പഠനലക്ഷ്യം ഏകോപിപ്പിക്കാൻ കണ്ണി സ്കൂളിനെ സഹായിക്കുന്നു. പഠിതാവിനെ രോഗനിർണയം ചെയ്യുക, ഗ്രേഡ് നൽകുക, വിദ്യാർത്ഥികളെ റാങ്ക് ചെയ്യുക, പഠനധാര തിരഞ്ഞെടുക്കുക, തൊഴിൽ തീരുമാനം എടുക്കുക എന്നിവ കണ്ണി ചെയ്യുന്നില്ല." })}</p></section>
        <section><h2>{copy(locale, { en: "Teacher review", ml: "അധ്യാപക പരിശോധന" })}</h2><p>{copy(locale, { en: "A teacher must review learning plans, student evidence, and family activities. AI output, when configured, is a draft and cannot publish itself.", ml: "പഠനപ്ലാൻ, വിദ്യാർത്ഥിയുടെ പഠന തെളിവ്, കുടുംബ പ്രവർത്തനം എന്നിവ അധ്യാപകൻ പരിശോധിക്കണം. AI ഔട്ട്പുട്ട് പ്രവർത്തനക്ഷമമാക്കിയാലും അത് കരട് മാത്രമാണ്, സ്വയം പ്രസിദ്ധീകരിക്കാൻ കഴിയില്ല." })}</p></section>
        <section><h2>{copy(locale, { en: "Safe use", ml: "സുരക്ഷിത ഉപയോഗം" })}</h2><p>{copy(locale, { en: "Do not use Kanni for emergencies, counselling, disciplinary surveillance, or confidential reporting. Contact the appropriate local service or responsible adult when immediate help is needed.", ml: "അടിയന്തരാവസ്ഥ, കൗൺസലിംഗ്, ശിക്ഷാനിരീക്ഷണം, രഹസ്യ റിപ്പോർട്ടിംഗ് എന്നിവയ്ക്ക് കണ്ണി ഉപയോഗിക്കരുത്. ഉടൻ സഹായം ആവശ്യമെങ്കിൽ അനുയോജ്യമായ പ്രാദേശിക സേവനത്തെയോ ഉത്തരവാദിത്തമുള്ള മുതിർന്നയാളെയോ ബന്ധപ്പെടുക." })}</p></section>
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
