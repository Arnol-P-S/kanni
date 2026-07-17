import { CycleStatus, SchoolRole } from "@prisma/client";
import type { Metadata } from "next";
import { CheckCircle2, HelpCircle, Send, Shapes } from "lucide-react";

import {
  flagStudentDisagreementAction,
  recordFirstAnswerAction,
  recordRevisionAction,
  useStudentSupportAction,
} from "@/app/actions/learning-cycle";
import { FractionVisual } from "@/components/fraction-visual";
import { PortalChrome, WaitingCard } from "@/components/portal-chrome";
import { requireActor } from "@/lib/auth";
import { growthSupportPresentations } from "@/lib/growth-support-presentations";
import { copy } from "@/lib/i18n";
import { getLearningCycleForActor } from "@/lib/school-data";

export const metadata: Metadata = { title: "Student workspace" };

export default async function StudentPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const actor = await requireActor(SchoolRole.student);
  const cycle = await getLearningCycleForActor(actor);
  const locale = actor.locale;
  const { notice } = await searchParams;
  const nextSupport = cycle?.nextSupport
    ? growthSupportPresentations[cycle.nextSupport]
    : null;

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title={copy(locale, { en: "Try, use support, and explain your thinking", ml: "ശ്രമിക്കുക, പിന്തുണ ഉപയോഗിക്കുക, നിങ്ങളുടെ ചിന്ത വിശദീകരിക്കുക" })}
      intro={copy(locale, { en: "Your first answer helps your teacher understand what support to offer. You can revise after opening the support.", ml: "ഏത് പിന്തുണ നൽകണമെന്ന് മനസ്സിലാക്കാൻ നിങ്ങളുടെ ആദ്യ ഉത്തരം അധ്യാപകനെ സഹായിക്കുന്നു. പിന്തുണ ഉപയോഗിച്ച ശേഷം നിങ്ങൾക്ക് ഉത്തരം തിരുത്താം." })}
    >
      {notice ? <p className="form-notice" role="status">{copy(locale, { en: "Your learning cycle has been updated.", ml: "നിങ്ങളുടെ പഠനചക്രം പുതുക്കി." })}</p> : null}
      {!cycle ? (
        <WaitingCard locale={locale} title={copy(locale, { en: "No learning goal is assigned", ml: "പഠനലക്ഷ്യം നൽകിയിട്ടില്ല" })} detail={copy(locale, { en: "Your teacher will publish a goal here when it is ready.", ml: "ലക്ഷ്യം തയ്യാറാകുമ്പോൾ അധ്യാപകൻ ഇവിടെ പ്രസിദ്ധീകരിക്കും." })} />
      ) : cycle.status === CycleStatus.draft ? (
        <WaitingCard locale={locale} title={copy(locale, { en: "Your teacher is preparing this activity", ml: "അധ്യാപകൻ ഈ പ്രവർത്തനം തയ്യാറാക്കുകയാണ്" })} detail={copy(locale, { en: "You will see the question and support when the plan is published.", ml: "പ്ലാൻ പ്രസിദ്ധീകരിക്കുമ്പോൾ ചോദ്യവും പിന്തുണയും കാണാം." })} />
      ) : cycle.status === CycleStatus.active ? (
        <div className="workspace-grid student-workspace-grid">
          {!cycle.firstAnswer ? (
            <section className="portal-card student-question-card">
              <p className="eyebrow">{copy(locale, { en: "First try", ml: "ആദ്യ ശ്രമം" })}</p>
              <h2>{copy(locale, { en: "The two wholes are the same size. Which part is larger?", ml: "രണ്ട് മുഴുവനുകളും ഒരേ വലുപ്പമാണ്. ഏത് ഭാഗമാണ് വലുത്?" })}</h2>
              <div className="question-preview"><Shapes aria-hidden="true" /><span>{copy(locale, { en: "One half or one quarter", ml: "ഒരു പകുതി അല്ലെങ്കിൽ ഒരു കാൽ" })}</span></div>
              <form action={recordFirstAnswerAction} className="answer-choice-grid">
                <button type="submit" name="answer" value="one_half"><strong>1/2</strong><span>{copy(locale, { en: "One half", ml: "ഒരു പകുതി" })}</span></button>
                <button type="submit" name="answer" value="one_quarter"><strong>1/4</strong><span>{copy(locale, { en: "One quarter", ml: "ഒരു കാൽ" })}</span></button>
              </form>
            </section>
          ) : !cycle.supportUsed ? (
            <section className="portal-card student-support-gate">
              <p className="eyebrow">{copy(locale, { en: "First answer recorded", ml: "ആദ്യ ഉത്തരം രേഖപ്പെടുത്തി" })}</p>
              <h2>{copy(locale, { en: "Now look at the support your teacher chose", ml: "ഇപ്പോൾ അധ്യാപകൻ തിരഞ്ഞെടുത്ത പിന്തുണ നോക്കുക" })}</h2>
              <p>{copy(locale, { en: "Your first choice was", ml: "നിങ്ങളുടെ ആദ്യ തിരഞ്ഞെടുപ്പ്" })}: <strong>{cycle.firstAnswer === "one_half" ? "1/2" : "1/4"}</strong>.</p>
              <form action={useStudentSupportAction}><button className="button primary" type="submit"><HelpCircle size={18} aria-hidden="true" />{copy(locale, { en: "Open support", ml: "പിന്തുണ തുറക്കുക" })}</button></form>
            </section>
          ) : !cycle.revisedAnswer ? (
            <>
              <section className="portal-card visual-support-card">
                <p className="eyebrow">{copy(locale, { en: "Teacher-selected support", ml: "അധ്യാപകൻ തിരഞ്ഞെടുത്ത പിന്തുണ" })}</p>
                <h2>{copy(locale, { en: "Compare equal wholes", ml: "ഒരേ വലുപ്പമുള്ള മുഴുവനുകൾ താരതമ്യം ചെയ്യുക" })}</h2>
                <FractionVisual />
                <p className="support-explanation">{cycle.supportExplanation}</p>
              </section>
              <section className="portal-card revision-card">
                <p className="eyebrow">{copy(locale, { en: "Try again", ml: "വീണ്ടും ശ്രമിക്കുക" })}</p>
                <h2>{copy(locale, { en: "Which part is larger now?", ml: "ഇപ്പോൾ ഏത് ഭാഗമാണ് വലുത്?" })}</h2>
                <form action={recordRevisionAction}>
                  <fieldset className="answer-choice-grid compact-answers"><legend className="sr-only">{copy(locale, { en: "Revised answer", ml: "പുതുക്കിയ ഉത്തരം" })}</legend><label><input type="radio" name="answer" value="one_half" required /><span><strong>1/2</strong>{copy(locale, { en: "One half", ml: "ഒരു പകുതി" })}</span></label><label><input type="radio" name="answer" value="one_quarter" required /><span><strong>1/4</strong>{copy(locale, { en: "One quarter", ml: "ഒരു കാൽ" })}</span></label></fieldset>
                  <fieldset className="explanation-choices"><legend>{copy(locale, { en: "Choose the reason that best matches your thinking", ml: "നിങ്ങളുടെ ചിന്തയോട് ഏറ്റവും യോജിക്കുന്ന കാരണം തിരഞ്ഞെടുക്കുക" })}</legend><label><input type="radio" name="explanation" value="same_whole_more_equal_parts" required /><span>{copy(locale, { en: "When the whole is the same size, more equal parts make each part smaller.", ml: "മുഴുവനിന്റെ വലുപ്പം ഒരേ ആണെങ്കിൽ, കൂടുതൽ തുല്യഭാഗങ്ങൾ ഉണ്ടാകുമ്പോൾ ഓരോ ഭാഗവും ചെറുതാകും." })}</span></label><label><input type="radio" name="explanation" value="four_is_bigger" required /><span>{copy(locale, { en: "Four is bigger than two.", ml: "നാല് രണ്ടിനേക്കാൾ വലുതാണ്." })}</span></label><label><input type="radio" name="explanation" value="not_sure" required /><span>{copy(locale, { en: "I am not sure yet.", ml: "എനിക്ക് ഇനിയും ഉറപ്പില്ല." })}</span></label></fieldset>
                  <button className="button primary" type="submit"><Send size={18} aria-hidden="true" />{copy(locale, { en: "Send to teacher", ml: "അധ്യാപകനിലേക്ക് അയക്കുക" })}</button>
                </form>
              </section>
            </>
          ) : null}
        </div>
      ) : cycle.status === CycleStatus.waiting_teacher_review ? (
        <section className="portal-card student-submitted-card">
          <CheckCircle2 aria-hidden="true" />
          <div><p className="eyebrow">{copy(locale, { en: "Evidence sent", ml: "പഠന തെളിവ് അയച്ചു" })}</p><h2>{copy(locale, { en: "Your teacher will review what changed", ml: "എന്താണ് മാറിയതെന്ന് അധ്യാപകൻ പരിശോധിക്കും" })}</h2><p>{copy(locale, { en: "Your revised answer and reason are saved. You can also ask the teacher to check the record if it does not reflect your thinking.", ml: "നിങ്ങളുടെ പുതുക്കിയ ഉത്തരവും കാരണവും സേവ് ചെയ്തു. രേഖ നിങ്ങളുടെ ചിന്തയെ ശരിയായി കാണിക്കുന്നില്ലെങ്കിൽ അധ്യാപകനോട് പരിശോധിക്കാൻ ആവശ്യപ്പെടാം." })}</p>{!cycle.disagreedWithRecord ? <form action={flagStudentDisagreementAction}><button className="button quiet" type="submit">{copy(locale, { en: "Ask teacher to check my record", ml: "എന്റെ രേഖ പരിശോധിക്കാൻ അധ്യാപകനോട് പറയുക" })}</button></form> : <p className="completion-line"><CheckCircle2 aria-hidden="true" />{copy(locale, { en: "Your review request is recorded.", ml: "നിങ്ങളുടെ പരിശോധനാ അഭ്യർത്ഥന രേഖപ്പെടുത്തി." })}</p>}</div>
        </section>
      ) : (
        <section className="portal-card next-activity-card">
          <p className="eyebrow">{copy(locale, { en: "Your teacher chose the next support", ml: "അധ്യാപകൻ അടുത്ത പിന്തുണ തിരഞ്ഞെടുത്തു" })}</p>
          <h2 lang={locale}>{nextSupport ? nextSupport.studentTitle[locale] : copy(locale, { en: "Keep explaining your thinking", ml: "നിങ്ങളുടെ ചിന്ത വിശദീകരിക്കുന്നത് തുടരുക" })}</h2>
          {nextSupport ? <ol lang={locale} className="support-step-list">{nextSupport.studentSteps[locale].map((step) => <li key={step}>{step}</li>)}</ol> : <p>{copy(locale, { en: "Your next activity will use the reviewed strategy.", ml: "അടുത്ത പ്രവർത്തനം പരിശോധിച്ച പിന്തുണാ രീതി ഉപയോഗിക്കും." })}</p>}
          <div className="teacher-choice-callout"><CheckCircle2 aria-hidden="true" /><span>{copy(locale, { en: "This changed because your teacher reviewed the previous activity.", ml: "മുൻ പ്രവർത്തനം അധ്യാപകൻ പരിശോധിച്ചതിനാലാണ് ഇത് മാറിയത്." })}</span></div>
        </section>
      )}
    </PortalChrome>
  );
}
