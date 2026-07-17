import { CycleStatus, SchoolRole } from "@prisma/client";
import type { Metadata } from "next";
import { CheckCircle2, MessageCircleMore } from "lucide-react";

import { recordFamilyResponseAction } from "@/app/actions/learning-cycle";
import { PortalChrome, WaitingCard } from "@/components/portal-chrome";
import { requireActor } from "@/lib/auth";
import { growthSupportPresentations } from "@/lib/growth-support-presentations";
import { copy } from "@/lib/i18n";
import { getLearningCycleForActor } from "@/lib/school-data";

export const metadata: Metadata = { title: "Parent workspace" };

export default async function ParentPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const actor = await requireActor(SchoolRole.parent);
  const cycle = await getLearningCycleForActor(actor);
  const locale = actor.locale;
  const { notice } = await searchParams;
  const support = cycle
    ? growthSupportPresentations[cycle.nextSupport ?? cycle.selectedSupport]
    : null;
  const familyLocale = locale;

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title={copy(locale, { en: "Understand the goal and help once at home", ml: "ലക്ഷ്യം മനസ്സിലാക്കി വീട്ടിൽ ഒരിക്കൽ സഹായിക്കുക" })}
      intro={copy(locale, { en: "Kanni turns the teacher's review into one short activity and gives you a simple way to respond.", ml: "അധ്യാപകന്റെ പരിശോധനയെ കണ്ണി ഒരു ചെറിയ പ്രവർത്തനമാക്കി മാറ്റുകയും ലളിതമായി പ്രതികരിക്കാൻ സഹായിക്കുകയും ചെയ്യുന്നു." })}
    >
      {notice ? <p className="form-notice" role="status">{copy(locale, { en: "Your response has been saved.", ml: "നിങ്ങളുടെ പ്രതികരണം സേവ് ചെയ്തു." })}</p> : null}
      {!cycle ? (
        <WaitingCard locale={locale} title={copy(locale, { en: "No learner is connected", ml: "പഠിതാവിനെ ബന്ധിപ്പിച്ചിട്ടില്ല" })} detail={copy(locale, { en: "Ask the school administrator to connect your account to the learner.", ml: "നിങ്ങളുടെ അക്കൗണ്ടിനെ പഠിതാവുമായി ബന്ധിപ്പിക്കാൻ സ്കൂൾ അഡ്മിനിസ്ട്രേറ്ററോട് ആവശ്യപ്പെടുക." })} />
      ) : cycle.status === CycleStatus.draft || cycle.status === CycleStatus.active || cycle.status === CycleStatus.waiting_teacher_review ? (
        <WaitingCard locale={locale} title={copy(locale, { en: "The teacher is still reviewing this goal", ml: "അധ്യാപകൻ ഈ ലക്ഷ്യം പരിശോധിച്ചുകൊണ്ടിരിക്കുന്നു" })} detail={copy(locale, { en: "A home activity will appear after the student responds and the teacher approves the next support.", ml: "വിദ്യാർത്ഥി പ്രതികരിച്ച് അധ്യാപകൻ അടുത്ത പിന്തുണ അംഗീകരിച്ച ശേഷം വീട്ടുപ്രവർത്തനം ഇവിടെ പ്രത്യക്ഷപ്പെടും." })} />
      ) : (
        <div className="workspace-grid parent-workspace-grid">
          <section className="portal-card family-summary-card">
            <p className="eyebrow">{copy(locale, { en: "What happened", ml: "എന്താണ് സംഭവിച്ചത്" })}</p>
            <h2>{copy(locale, { en: "The learner compared one half and one quarter", ml: "പഠിതാവ് ഒരു പകുതിയും ഒരു കാലും താരതമ്യം ചെയ്തു" })}</h2>
            <p>{copy(locale, { en: `The first choice was ${cycle.firstAnswer === "one_half" ? "one half" : "one quarter"}. After using the teacher-selected support, the revised choice was ${cycle.revisedAnswer === "one_half" ? "one half" : "one quarter"}.`, ml: `ആദ്യ തിരഞ്ഞെടുപ്പ് ${cycle.firstAnswer === "one_half" ? "ഒരു പകുതി" : "ഒരു കാൽ"} ആയിരുന്നു. അധ്യാപകൻ തിരഞ്ഞെടുത്ത പിന്തുണ ഉപയോഗിച്ച ശേഷം പുതുക്കിയ തിരഞ്ഞെടുപ്പ് ${cycle.revisedAnswer === "one_half" ? "ഒരു പകുതി" : "ഒരു കാൽ"} ആയി.` })}</p>
          </section>

          <section className="portal-card family-activity-card">
            <div className="family-activity-heading"><MessageCircleMore aria-hidden="true" /><div><p className="eyebrow">{copy(locale, { en: "Try this once at home", ml: "വീട്ടിൽ ഒരിക്കൽ ഇത് ചെയ്യുക" })}</p><h2 lang={familyLocale}>{support?.familyTitle[familyLocale]}</h2></div></div>
            <p lang={familyLocale} className="family-activity-detail">{support?.familyDetail[familyLocale]}</p>
            <p className="family-stop-note">{copy(locale, { en: "Keep it short. Stop if the learner is tired or does not want to continue.", ml: "പ്രവർത്തനം ചെറുതാക്കുക. പഠിതാവ് ക്ഷീണിതനാണെങ്കിൽ അല്ലെങ്കിൽ തുടരാൻ ആഗ്രഹിക്കുന്നില്ലെങ്കിൽ നിർത്തുക." })}</p>

            {cycle.familyResponse === "not_sent" ? (
              <form action={recordFamilyResponseAction} className="family-response-form">
                <p>{copy(locale, { en: "What would you like the teacher to know?", ml: "അധ്യാപകൻ എന്ത് അറിയണം?" })}</p>
                <button type="submit" name="response" value="tried">{copy(locale, { en: "We tried it", ml: "ഞങ്ങൾ ചെയ്തു" })}</button>
                <button type="submit" name="response" value="need_another_idea">{copy(locale, { en: "We need another idea", ml: "മറ്റൊരു ആശയം വേണം" })}</button>
                <button type="submit" name="response" value="contact_teacher">{copy(locale, { en: "Please contact me", ml: "എന്നെ ബന്ധപ്പെടുക" })}</button>
              </form>
            ) : (
              <div className="family-response-complete"><CheckCircle2 aria-hidden="true" /><div><strong>{copy(locale, { en: "Response sent", ml: "പ്രതികരണം അയച്ചു" })}</strong><p>{cycle.familyResponse === "tried" ? copy(locale, { en: "We tried the activity.", ml: "ഞങ്ങൾ പ്രവർത്തനം ചെയ്തു." }) : cycle.familyResponse === "need_another_idea" ? copy(locale, { en: "We asked for another idea.", ml: "ഞങ്ങൾ മറ്റൊരു ആശയം ചോദിച്ചു." }) : copy(locale, { en: "We asked the teacher to contact us.", ml: "അധ്യാപകൻ ബന്ധപ്പെടണമെന്ന് ആവശ്യപ്പെട്ടു." })}</p></div></div>
            )}
          </section>
        </div>
      )}
    </PortalChrome>
  );
}
