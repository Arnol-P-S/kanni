import type { Metadata } from "next";

import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { copy, getRequestLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  return (
    <>
      <PublicHeader locale={locale} returnTo="/privacy" />
      <main id="main-content" className="page-shell legal-page">
        <p className="eyebrow">{copy(locale, { en: "Privacy", ml: "സ്വകാര്യത" })}</p>
        <h1>{copy(locale, { en: "Only the information needed for learning support", ml: "പഠനപിന്തുണയ്ക്ക് ആവശ്യമായ വിവരങ്ങൾ മാത്രം" })}</h1>
        <p>{copy(locale, { en: "Kanni stores school accounts, role memberships, approved teacher-student and parent-student links, learning-cycle responses, language preference, and security audit events in PostgreSQL.", ml: "സ്കൂൾ അക്കൗണ്ടുകൾ, ചുമതല അംഗത്വങ്ങൾ, അംഗീകരിച്ച അധ്യാപക-വിദ്യാർത്ഥി, രക്ഷിതാവ്-വിദ്യാർത്ഥി ബന്ധങ്ങൾ, പഠനചക്ര പ്രതികരണങ്ങൾ, ഭാഷാ മുൻഗണന, സുരക്ഷാ ഓഡിറ്റ് സംഭവങ്ങൾ എന്നിവ കണ്ണി PostgreSQL-ൽ സൂക്ഷിക്കുന്നു." })}</p>
        <section><h2>{copy(locale, { en: "Account and session data", ml: "അക്കൗണ്ടും സെഷൻ വിവരങ്ങളും" })}</h2><p>{copy(locale, { en: "Passwords are stored as bcrypt hashes. The browser receives an HttpOnly session cookie. Server sessions expire and can be revoked. Login throttling keys are hashed before storage.", ml: "പാസ്‌വേഡുകൾ bcrypt ഹാഷുകളായി സൂക്ഷിക്കുന്നു. ബ്രൗസറിന് HttpOnly സെഷൻ കുക്കി ലഭിക്കുന്നു. സെഷനുകൾ കാലഹരണപ്പെടുകയും പിൻവലിക്കാനാകുകയും ചെയ്യും. ലോഗിൻ നിയന്ത്രണ കീകൾ സൂക്ഷിക്കുന്നതിന് മുമ്പ് ഹാഷ് ചെയ്യുന്നു." })}</p></section>
        <section><h2>{copy(locale, { en: "Learning records", ml: "പഠന രേഖകൾ" })}</h2><p>{copy(locale, { en: "A learning cycle records fixed-choice answers, support used, teacher review, and the parent's bounded response. Kanni does not create public profiles, rankings, follower graphs, or direct student messaging.", ml: "പഠനചക്രത്തിൽ നിശ്ചിത ഉത്തരങ്ങൾ, ഉപയോഗിച്ച പിന്തുണ, അധ്യാപക പരിശോധന, രക്ഷിതാവിന്റെ പരിമിത പ്രതികരണം എന്നിവ രേഖപ്പെടുത്തുന്നു. പൊതു പ്രൊഫൈലുകൾ, റാങ്കിംഗ്, ഫോളോവർ ഗ്രാഫ്, വിദ്യാർത്ഥികൾക്കുള്ള നേരിട്ടുള്ള സന്ദേശം എന്നിവ കണ്ണി സൃഷ്ടിക്കുന്നില്ല." })}</p></section>
        <section><h2>{copy(locale, { en: "Optional AI", ml: "ഐച്ഛിക AI" })}</h2><p>{copy(locale, { en: "AI features are off unless the school operator configures a separate provider key and release controls. When enabled, Kanni sends only the selected learning context needed for a bounded draft. Provider requests are not used for authentication or authorization.", ml: "സ്കൂൾ ഓപ്പറേറ്റർ പ്രത്യേക പ്രൊവൈഡർ കീയും റിലീസ് നിയന്ത്രണങ്ങളും ക്രമീകരിക്കുന്നതുവരെ AI സവിശേഷതകൾ ഓഫായിരിക്കും. പ്രവർത്തനക്ഷമമാക്കിയാൽ, പരിമിത കരടിനാവശ്യമായ തിരഞ്ഞെടുത്ത പഠനസന്ദർഭം മാത്രം കണ്ണി അയക്കും. പ്രൊവൈഡർ അഭ്യർത്ഥനകൾ തിരിച്ചറിയലിനോ അനുമതിക്കോ ഉപയോഗിക്കില്ല." })}</p></section>
        <section><h2>{copy(locale, { en: "School responsibility", ml: "സ്കൂളിന്റെ ഉത്തരവാദിത്തം" })}</h2><p>{copy(locale, { en: "A school must set its retention period, obtain the permissions required in its jurisdiction, review who can access each learner, and provide a contact for corrections or deletion requests before using Kanni with real student data.", ml: "യഥാർത്ഥ വിദ്യാർത്ഥി വിവരങ്ങളുമായി കണ്ണി ഉപയോഗിക്കുന്നതിന് മുമ്പ് സ്കൂൾ നിലനിർത്തൽ കാലയളവ് നിശ്ചയിക്കുകയും ആവശ്യമായ അനുമതികൾ നേടുകയും ഓരോ പഠിതാവിനെയും ആരെല്ലാം കാണാമെന്ന് പരിശോധിക്കുകയും തിരുത്തൽ അല്ലെങ്കിൽ മായ്ക്കൽ അഭ്യർത്ഥനകൾക്കായി ബന്ധപ്പെടാനുള്ള മാർഗം നൽകുകയും വേണം." })}</p></section>
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
