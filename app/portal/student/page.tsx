import { CycleStatus, SchoolRole } from "@prisma/client";
import type { Metadata } from "next";
import {
  Brain,
  CheckCircle2,
  Hammer,
  HelpCircle,
  RefreshCw,
  SearchCheck,
  Send,
  Shapes,
} from "lucide-react";

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
import {
  artifactCritiquePresentations,
  makerPathPresentations,
  scaffoldLevelPresentations,
} from "@/lib/maker-challenge";
import { getLearningCycleForActor } from "@/lib/school-data";

export const metadata: Metadata = { title: "Student workspace" };

function textList(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

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
  const visiblePrompts = cycle
    ? textList(cycle.supportThinkingPrompts)
    : [];
  const currentScaffold = cycle
    ? scaffoldLevelPresentations[cycle.scaffoldLevel]
    : null;
  const nextScaffold = cycle?.nextScaffoldLevel
    ? scaffoldLevelPresentations[cycle.nextScaffoldLevel]
    : null;
  const nextSupportSteps = nextSupport
    ? cycle?.nextScaffoldLevel === "independent"
      ? []
      : cycle?.nextScaffoldLevel === "light"
        ? nextSupport.studentSteps[locale].slice(-1)
        : nextSupport.studentSteps[locale]
    : [];
  const nextActivityTitle =
    cycle?.nextScaffoldLevel === "independent"
      ? copy(locale, {
          en: "Start with your own plan",
          ml: "നിങ്ങളുടെ സ്വന്തം പദ്ധതിയിൽ തുടങ്ങുക",
        })
      : cycle?.nextScaffoldLevel === "light"
        ? copy(locale, {
            en: "Start with one comparison question",
            ml: "ഒരു താരതമ്യ ചോദ്യത്തിൽ തുടങ്ങുക",
          })
        : nextSupport
          ? nextSupport.studentTitle[locale]
          : copy(locale, {
              en: "Keep explaining your thinking",
              ml: "നിങ്ങളുടെ ചിന്ത വിശദീകരിക്കുന്നത് തുടരുക",
            });

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title={copy(locale, { en: "Think, make, test, and revise", ml: "ചിന്തിക്കുക, നിർമ്മിക്കുക, പരീക്ഷിക്കുക, തിരുത്തുക" })}
      intro={copy(locale, { en: "Choose what you want to make. Kanni can ask questions, but the plan and final work stay yours.", ml: "നിങ്ങൾ എന്ത് നിർമ്മിക്കണമെന്ന് തിരഞ്ഞെടുക്കുക. കണ്ണിക്ക് ചോദ്യങ്ങൾ ചോദിക്കാം, പക്ഷേ പദ്ധതിയും അന്തിമ സൃഷ്ടിയും നിങ്ങളുടേതാണ്." })}
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
              <h2>{cycle.scaffoldLevel === "independent" ? copy(locale, { en: "Start with your own idea", ml: "നിങ്ങളുടെ സ്വന്തം ആശയത്തിൽ തുടങ്ങുക" }) : copy(locale, { en: "Now use only the support your teacher chose", ml: "ഇപ്പോൾ അധ്യാപകൻ തിരഞ്ഞെടുത്ത പിന്തുണ മാത്രം ഉപയോഗിക്കുക" })}</h2>
              <p>{copy(locale, { en: "Your first choice was", ml: "നിങ്ങളുടെ ആദ്യ തിരഞ്ഞെടുപ്പ്" })}: <strong>{cycle.firstAnswer === "one_half" ? "1/2" : "1/4"}</strong>.</p>
              <p><strong>{currentScaffold ? copy(locale, currentScaffold.title) : null}</strong> · {currentScaffold ? copy(locale, currentScaffold.detail) : null}</p>
              <form action={useStudentSupportAction}><button className="button primary" type="submit"><HelpCircle size={18} aria-hidden="true" />{cycle.scaffoldLevel === "independent" ? copy(locale, { en: "Continue without AI support", ml: "AI സഹായമില്ലാതെ തുടരുക" }) : copy(locale, { en: "Open my scaffold", ml: "എന്റെ സഹായഘടന തുറക്കുക" })}</button></form>
            </section>
          ) : !cycle.revisedAnswer ? (
            <>
              <section className="portal-card visual-support-card">
                <div className="card-heading-row"><div><p className="eyebrow">{copy(locale, { en: "Teacher-selected scaffold", ml: "അധ്യാപകൻ തിരഞ്ഞെടുത്ത സഹായഘടന" })}</p><h2>{cycle.scaffoldLevel === "independent" ? copy(locale, { en: "Your thinking leads", ml: "നിങ്ങളുടെ ചിന്തയാണ് മുന്നിൽ" }) : copy(locale, { en: "AI asks. You decide.", ml: "AI ചോദിക്കുന്നു. നിങ്ങൾ തീരുമാനിക്കുന്നു." })}</h2></div><span className={`origin-badge ${cycle.supportOrigin}`}>{cycle.scaffoldLevel === "independent" ? copy(locale, { en: "No AI call", ml: "AI കോൾ ഇല്ല" }) : cycle.supportOrigin === "gpt_5_6" ? "GPT-5.6 Luna" : copy(locale, { en: "Reviewed", ml: "പരിശോധിച്ചത്" })}</span></div>
                {cycle.scaffoldLevel === "guided" ? <FractionVisual /> : null}
                {cycle.scaffoldLevel !== "independent" ? <p lang={locale} className="support-explanation">{cycle.supportExplanation}</p> : null}
                {visiblePrompts.length > 0 ? <div className="socratic-prompt-panel"><Brain aria-hidden="true" /><div><h3>{copy(locale, { en: "Pause and think", ml: "നിർത്തി ചിന്തിക്കുക" })}</h3><ol lang={locale}>{visiblePrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol></div></div> : null}
                <p lang={locale} className="student-handoff-prompt">{cycle.supportHandoffPrompt}</p>
                <small className="grounding-note">{copy(locale, { en: "Kanni never writes your artifact. Your teacher sees what you submit; parents and administrators do not see the raw text.", ml: "കണ്ണി നിങ്ങളുടെ സൃഷ്ടി എഴുതുന്നില്ല. നിങ്ങൾ സമർപ്പിക്കുന്നത് അധ്യാപകൻ കാണും; അസംസ്കൃത എഴുത്ത് രക്ഷിതാവോ അഡ്മിനിസ്ട്രേറ്ററോ കാണില്ല." })}</small>
              </section>
              <section className="portal-card revision-card maker-studio-card">
                <p className="eyebrow">{copy(locale, { en: "Your maker studio", ml: "നിങ്ങളുടെ നിർമ്മാണ ഇടം" })}</p>
                <h2>{copy(locale, { en: "Create, critique, revise", ml: "നിർമ്മിക്കുക, വിമർശിക്കുക, തിരുത്തുക" })}</h2>
                <form action={recordRevisionAction}>
                  <fieldset className="maker-choice-grid"><legend><span>1</span>{copy(locale, { en: "Choose what you will make", ml: "നിങ്ങൾ എന്ത് നിർമ്മിക്കുമെന്ന് തിരഞ്ഞെടുക്കുക" })}</legend>{Object.entries(makerPathPresentations).map(([value, presentation]) => <label key={value}><input type="radio" name="makerPath" value={value} required /><span><Hammer aria-hidden="true" /><strong>{copy(locale, presentation.title)}</strong><small>{copy(locale, presentation.detail)}</small></span></label>)}</fieldset>
                  <label className="maker-text-field"><span><strong>2</strong>{copy(locale, { en: "Describe your first design", ml: "നിങ്ങളുടെ ആദ്യ രൂപകൽപ്പന വിവരിക്കുക" })}</span><textarea name="artifactDraft" minLength={30} maxLength={600} rows={5} required placeholder={copy(locale, { en: "What will you make, and how will it show halves and quarters?", ml: "നിങ്ങൾ എന്താണ് നിർമ്മിക്കുക? അത് പകുതിയും കാലും എങ്ങനെ കാണിക്കും?" })} /><small>{copy(locale, { en: "Use 30 to 600 characters. Do not include names or contact details.", ml: "30 മുതൽ 600 വരെ അക്ഷരങ്ങൾ ഉപയോഗിക്കുക. പേരുകളോ ബന്ധപ്പെടാനുള്ള വിവരങ്ങളോ ചേർക്കരുത്." })}</small></label>
                  <fieldset className="maker-critique-list"><legend><span>3</span>{copy(locale, { en: "Critique your first design", ml: "നിങ്ങളുടെ ആദ്യ രൂപകൽപ്പന പരിശോധിക്കുക" })}</legend>{Object.entries(artifactCritiquePresentations).map(([value, presentation]) => <label key={value}><input type="radio" name="artifactCritique" value={value} required /><span><SearchCheck aria-hidden="true" />{copy(locale, presentation)}</span></label>)}</fieldset>
                  <label className="maker-text-field"><span><strong>4</strong>{copy(locale, { en: "Revise it and explain what changed", ml: "തിരുത്തി എന്താണ് മാറിയതെന്ന് വിശദീകരിക്കുക" })}</span><textarea name="artifactRevision" minLength={30} maxLength={600} rows={5} required placeholder={copy(locale, { en: "What did you improve after checking your work?", ml: "നിങ്ങളുടെ പ്രവർത്തനം പരിശോധിച്ചതിന് ശേഷം എന്താണ് മെച്ചപ്പെടുത്തിയത്?" })} /></label>
                  <div className="maker-math-check"><RefreshCw aria-hidden="true" /><div><p className="eyebrow">{copy(locale, { en: "Final self-check", ml: "അവസാന സ്വയംപരിശോധന" })}</p><h3>{copy(locale, { en: "Which part is larger now?", ml: "ഇപ്പോൾ ഏത് ഭാഗമാണ് വലുത്?" })}</h3></div></div>
                  <fieldset className="answer-choice-grid compact-answers"><legend className="sr-only">{copy(locale, { en: "Revised answer", ml: "പുതുക്കിയ ഉത്തരം" })}</legend><label><input type="radio" name="answer" value="one_half" required /><span><strong>1/2</strong>{copy(locale, { en: "One half", ml: "ഒരു പകുതി" })}</span></label><label><input type="radio" name="answer" value="one_quarter" required /><span><strong>1/4</strong>{copy(locale, { en: "One quarter", ml: "ഒരു കാൽ" })}</span></label></fieldset>
                  <fieldset className="explanation-choices"><legend>{copy(locale, { en: "Choose the reason that best matches your thinking", ml: "നിങ്ങളുടെ ചിന്തയോട് ഏറ്റവും യോജിക്കുന്ന കാരണം തിരഞ്ഞെടുക്കുക" })}</legend><label><input type="radio" name="explanation" value="same_whole_more_equal_parts" required /><span>{copy(locale, { en: "When the whole is the same size, more equal parts make each part smaller.", ml: "മുഴുവനിന്റെ വലുപ്പം ഒരേ ആണെങ്കിൽ, കൂടുതൽ തുല്യഭാഗങ്ങൾ ഉണ്ടാകുമ്പോൾ ഓരോ ഭാഗവും ചെറുതാകും." })}</span></label><label><input type="radio" name="explanation" value="four_is_bigger" required /><span>{copy(locale, { en: "Four is bigger than two.", ml: "നാല് രണ്ടിനേക്കാൾ വലുതാണ്." })}</span></label><label><input type="radio" name="explanation" value="not_sure" required /><span>{copy(locale, { en: "I am not sure yet.", ml: "എനിക്ക് ഇനിയും ഉറപ്പില്ല." })}</span></label></fieldset>
                  <button className="button primary" type="submit"><Send size={18} aria-hidden="true" />{copy(locale, { en: "Send my work to the teacher", ml: "എന്റെ പ്രവർത്തനം അധ്യാപകനിലേക്ക് അയക്കുക" })}</button>
                </form>
              </section>
            </>
          ) : null}
        </div>
      ) : cycle.status === CycleStatus.waiting_teacher_review ? (
        <section className="portal-card student-submitted-card">
          <CheckCircle2 aria-hidden="true" />
          <div><p className="eyebrow">{copy(locale, { en: "Work sent", ml: "പ്രവർത്തനം അയച്ചു" })}</p><h2>{copy(locale, { en: "Your teacher will review what you made and changed", ml: "നിങ്ങൾ നിർമ്മിച്ചതും മാറ്റിയതും അധ്യാപകൻ പരിശോധിക്കും" })}</h2><p>{copy(locale, { en: "Your first design, self-critique, revision, and mathematics check are saved for your teacher.", ml: "നിങ്ങളുടെ ആദ്യ രൂപകൽപ്പന, സ്വയംപരിശോധന, തിരുത്തൽ, ഗണിത പരിശോധന എന്നിവ അധ്യാപകനായി സേവ് ചെയ്തു." })}</p>{!cycle.disagreedWithRecord ? <form action={flagStudentDisagreementAction}><button className="button quiet" type="submit">{copy(locale, { en: "Ask teacher to check my record", ml: "എന്റെ രേഖ പരിശോധിക്കാൻ അധ്യാപകനോട് പറയുക" })}</button></form> : <p className="completion-line"><CheckCircle2 aria-hidden="true" />{copy(locale, { en: "Your review request is recorded.", ml: "നിങ്ങളുടെ പരിശോധനാ അഭ്യർത്ഥന രേഖപ്പെടുത്തി." })}</p>}</div>
        </section>
      ) : (
        <section className="portal-card next-activity-card">
          <p className="eyebrow">{copy(locale, { en: "Your teacher chose the next support", ml: "അധ്യാപകൻ അടുത്ത പിന്തുണ തിരഞ്ഞെടുത്തു" })}</p>
          <h2 lang={locale}>{nextActivityTitle}</h2>
          {nextScaffold ? <div className="next-scaffold-summary"><strong>{copy(locale, nextScaffold.title)}</strong><span>{copy(locale, nextScaffold.detail)}</span></div> : null}
          {nextSupportSteps.length > 0 ? <ol lang={locale} className="support-step-list">{nextSupportSteps.map((step) => <li key={step}>{step}</li>)}</ol> : <p>{cycle.nextScaffoldLevel === "independent" ? copy(locale, { en: "Make your first plan before opening any help. Use the final self-check when you are ready.", ml: "സഹായം തുറക്കുന്നതിന് മുമ്പ് നിങ്ങളുടെ ആദ്യ പദ്ധതി തയ്യാറാക്കുക. തയ്യാറാകുമ്പോൾ അവസാന സ്വയംപരിശോധന ഉപയോഗിക്കുക." }) : copy(locale, { en: "Your next activity will use the reviewed strategy.", ml: "അടുത്ത പ്രവർത്തനം പരിശോധിച്ച പിന്തുണാ രീതി ഉപയോഗിക്കും." })}</p>}
          <div className="teacher-choice-callout"><CheckCircle2 aria-hidden="true" /><span>{copy(locale, { en: "This changed because your teacher reviewed the previous activity.", ml: "മുൻ പ്രവർത്തനം അധ്യാപകൻ പരിശോധിച്ചതിനാലാണ് ഇത് മാറിയത്." })}</span></div>
        </section>
      )}
    </PortalChrome>
  );
}
