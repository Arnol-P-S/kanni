import { CycleStatus, SchoolRole } from "@prisma/client";
import type { Metadata } from "next";
import {
  Brain,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Lightbulb,
  MessageCircleMore,
  PenTool,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  draftTeacherPlanWithAiAction,
  publishTeacherPlanAction,
  restoreProjectAuthoredPlanAction,
  reviewStudentEvidenceAction,
} from "@/app/actions/learning-cycle";
import { PortalChrome, WaitingCard } from "@/components/portal-chrome";
import { getGrowthAiCapability } from "@/lib/ai/growth-ai";
import { requireActor } from "@/lib/auth";
import { misconceptionLabels } from "@/lib/growth-cycle";
import { copy } from "@/lib/i18n";
import {
  artifactCritiquePresentations,
  makerPathPresentations,
  scaffoldLevelPresentations,
} from "@/lib/maker-challenge";
import { getLearningCycleForActor } from "@/lib/school-data";

export const metadata: Metadata = { title: "Teacher workspace" };

function textList(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

const supportOptions = [
  {
    value: "fraction_strips",
    title: { en: "Use fraction strips", ml: "ഭിന്ന സ്ട്രിപ്പുകൾ ഉപയോഗിക്കുക" },
    detail: { en: "Compare equal paper strips divided into two and four parts.", ml: "രണ്ടും നാലും തുല്യഭാഗങ്ങളാക്കിയ ഒരേ വലുപ്പമുള്ള പേപ്പർ സ്ട്രിപ്പുകൾ താരതമ്യം ചെയ്യുക." },
  },
  {
    value: "guided_questions",
    title: { en: "Ask guided questions", ml: "വഴികാട്ടി ചോദ്യങ്ങൾ ചോദിക്കുക" },
    detail: { en: "Ask about equal wholes, number of parts, and the space one part takes.", ml: "ഒരേ വലുപ്പമുള്ള മുഴുവൻ, ഭാഗങ്ങളുടെ എണ്ണം, ഒരു ഭാഗം എടുക്കുന്ന സ്ഥലം എന്നിവയെക്കുറിച്ച് ചോദിക്കുക." },
  },
  {
    value: "explain_to_someone",
    title: { en: "Explain to someone", ml: "മറ്റൊരാൾക്ക് വിശദീകരിക്കുക" },
    detail: { en: "Ask the learner to show the comparison and explain the reason.", ml: "താരതമ്യം കാണിച്ച് കാരണം വിശദീകരിക്കാൻ പഠിതാവിനോട് ആവശ്യപ്പെടുക." },
  },
] as const;

const scaffoldOptions = Object.entries(scaffoldLevelPresentations);

export default async function TeacherPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const actor = await requireActor(SchoolRole.teacher);
  const cycle = await getLearningCycleForActor(actor);
  const locale = actor.locale;
  const { notice } = await searchParams;
  const ai = getGrowthAiCapability();
  const canRequestAi = ai.available && cycle?.aiStatus === "not_requested";
  const misconceptionIds = cycle ? textList(cycle.misconceptionIds) : [];
  const suggestedNextScaffold = cycle
    ? cycle.scaffoldLevel === "guided"
      ? "light"
      : "independent"
    : "guided";

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title={copy(locale, { en: "Plan, notice, and choose what happens next", ml: "ആസൂത്രണം ചെയ്യുക, ശ്രദ്ധിക്കുക, അടുത്തത് തിരഞ്ഞെടുക്കുക" })}
      intro={copy(locale, { en: "Turn one learning goal into a focused activity, then use the student's evidence to choose the next support.", ml: "ഒരു പഠനലക്ഷ്യത്തെ കേന്ദ്രീകൃത പ്രവർത്തനമാക്കി, വിദ്യാർത്ഥിയുടെ പഠന തെളിവ് ഉപയോഗിച്ച് അടുത്ത പിന്തുണ തിരഞ്ഞെടുക്കുക." })}
    >
      {notice ? <p className="form-notice" role="status">{copy(locale, { en: "The learning cycle has been updated.", ml: "പഠനചക്രം പുതുക്കി." })}</p> : null}
      {!cycle ? (
        <WaitingCard locale={locale} title={copy(locale, { en: "No student is assigned", ml: "വിദ്യാർത്ഥിയെ നിയമിച്ചിട്ടില്ല" })} detail={copy(locale, { en: "Ask the school administrator to connect a student to your workspace.", ml: "ഒരു വിദ്യാർത്ഥിയെ നിങ്ങളുടെ പ്രവർത്തിസ്ഥലവുമായി ബന്ധിപ്പിക്കാൻ സ്കൂൾ അഡ്മിനിസ്ട്രേറ്ററോട് ആവശ്യപ്പെടുക." })} />
      ) : (
        <div className="workspace-grid teacher-workspace-grid">
          <section className="portal-card goal-card">
            <p className="eyebrow">{copy(locale, { en: "Current learning goal", ml: "നിലവിലെ പഠനലക്ഷ്യം" })}</p>
            <div className="goal-card-heading">
              <div><h2>{cycle.title}</h2><p>{cycle.subject} · {cycle.gradeLabel}</p></div>
              <span>{cycle.studentMembership.user.displayName}</span>
            </div>
            <p className="goal-statement">{cycle.goal}</p>
          </section>

          {cycle.status === CycleStatus.draft ? (
            <>
              <section className="portal-card plan-card">
                <div className="card-heading-row">
                  <div><p className="eyebrow">{copy(locale, { en: "Lesson plan", ml: "പാഠ ആസൂത്രണം" })}</p><h2>{copy(locale, { en: "Plan for understanding", ml: "മനസ്സിലാക്കലിനായി ആസൂത്രണം ചെയ്യുക" })}</h2></div>
                  <span className="status-badge">{cycle.planOrigin === "gpt_5_6" ? "GPT-5.6 Luna draft" : copy(locale, { en: "Teacher-ready", ml: "അധ്യാപകത്തിന് തയ്യാറാണ്" })}</span>
                </div>
                <div className="plan-columns">
                  <div><h3>{copy(locale, { en: "Success looks like", ml: "വിജയം എങ്ങനെയാണ്" })}</h3><ul>{textList(cycle.planSuccessCriteria).map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><h3>{copy(locale, { en: "Learning sequence", ml: "പഠനക്രമം" })}</h3><ol>{textList(cycle.planLearningSequence).map((item) => <li key={item}>{item}</li>)}</ol></div>
                </div>
                <div className="teacher-leverage-grid">
                  <article>
                    <Brain aria-hidden="true" />
                    <div><h3>{copy(locale, { en: "Anticipate ideas to check", ml: "പരിശോധിക്കേണ്ട ആശയങ്ങൾ മുൻകൂട്ടി കാണുക" })}</h3><ul>{misconceptionIds.map((id) => <li key={id}>{misconceptionLabels[id as keyof typeof misconceptionLabels] ?? id}</li>)}</ul></div>
                  </article>
                  <article>
                    <BookOpenCheck aria-hidden="true" />
                    <div><h3>{copy(locale, { en: "Assess for understanding", ml: "മനസ്സിലാക്കൽ പരിശോധിക്കുക" })}</h3><p>{cycle.quickCheck}</p></div>
                  </article>
                  <article>
                    <MessageCircleMore aria-hidden="true" />
                    <div><h3>{copy(locale, { en: "Communicate with family", ml: "കുടുംബവുമായി ആശയവിനിമയം നടത്തുക" })}</h3><p lang={cycle.familyLocale}>{cycle.familyDraft}</p></div>
                  </article>
                  <article className="agency-guard-card">
                    <ShieldCheck aria-hidden="true" />
                    <div><h3>{copy(locale, { en: "Protect learner agency", ml: "പഠിതാവിന്റെ സ്വയംനിർണ്ണയം സംരക്ഷിക്കുക" })}</h3><p>{cycle.planAgencyMove}</p></div>
                  </article>
                </div>
                <div className="teacher-ai-actions">
                  <form action={draftTeacherPlanWithAiAction}><button className="button secondary" type="submit" disabled={!canRequestAi}><Sparkles size={18} aria-hidden="true" />{copy(locale, { en: "Draft grounded plan with AI", ml: "AI ഉപയോഗിച്ച് അടിസ്ഥാനപ്പെടുത്തിയ പ്ലാൻ തയ്യാറാക്കുക" })}</button></form>
                  {cycle.planOrigin === "gpt_5_6" ? <form action={restoreProjectAuthoredPlanAction}><button className="button quiet" type="submit">{copy(locale, { en: "Restore reviewed plan", ml: "പരിശോധിച്ച പ്ലാൻ പുനഃസ്ഥാപിക്കുക" })}</button></form> : null}
                  {!ai.available ? <small>{copy(locale, { en: "AI planning is not configured. The reviewed plan remains available.", ml: "AI ആസൂത്രണം ക്രമീകരിച്ചിട്ടില്ല. പരിശോധിച്ച പ്ലാൻ ലഭ്യമാണ്." })}</small> : null}
                  {ai.available && cycle.aiStatus === "not_requested" ? <small>{copy(locale, { en: "The draft uses only the reviewed Kanni lesson pack. You review it before anything reaches the student or parent.", ml: "പരിശോധിച്ച കണ്ണി പാഠഭാഗം മാത്രം ഉപയോഗിച്ചാണ് കരട്. വിദ്യാർത്ഥിയിലേക്കോ രക്ഷിതാവിലേക്കോ എത്തുന്നതിന് മുമ്പ് നിങ്ങൾ അത് പരിശോധിക്കും." })}</small> : null}
                  {ai.available && cycle.aiStatus !== "not_requested" ? <small>{copy(locale, { en: "One AI planning draft is allowed for this learning cycle.", ml: "ഈ പഠനചക്രത്തിന് ഒരു AI ആസൂത്രണ കരട് മാത്രമേ അനുവദിക്കൂ." })}</small> : null}
                </div>
                <div className="current-scaffold-callout">
                  <ShieldCheck aria-hidden="true" />
                  <div><strong>{copy(locale, { en: "Current scaffold level", ml: "നിലവിലെ സഹായഘടന" })}: {copy(locale, scaffoldLevelPresentations[cycle.scaffoldLevel].title)}</strong><span>{copy(locale, scaffoldLevelPresentations[cycle.scaffoldLevel].detail)}</span></div>
                </div>
              </section>

              <section className="portal-card publish-plan-card">
                <div><p className="eyebrow">{copy(locale, { en: "Differentiate support", ml: "വ്യത്യസ്ത പിന്തുണ" })}</p><h2>{copy(locale, { en: "Choose the support the student can open", ml: "വിദ്യാർത്ഥിക്ക് ഉപയോഗിക്കാവുന്ന പിന്തുണ തിരഞ്ഞെടുക്കുക" })}</h2></div>
                <form action={publishTeacherPlanAction}>
                  <fieldset className="strategy-choice-grid">
                    <legend className="sr-only">{copy(locale, { en: "Support strategy", ml: "പിന്തുണാ രീതി" })}</legend>
                    {supportOptions.map((option) => (
                      <label key={option.value}><input type="radio" name="strategy" value={option.value} defaultChecked={option.value === cycle.selectedSupport} /><span><Lightbulb aria-hidden="true" /><strong>{copy(locale, option.title)}</strong><small>{copy(locale, option.detail)}</small></span></label>
                    ))}
                  </fieldset>
                  <button className="button primary" type="submit"><Send size={18} aria-hidden="true" />{copy(locale, { en: "Publish student activity", ml: "വിദ്യാർത്ഥി പ്രവർത്തനം പ്രസിദ്ധീകരിക്കുക" })}</button>
                </form>
              </section>
            </>
          ) : cycle.status === CycleStatus.active ? (
            <WaitingCard locale={locale} title={copy(locale, { en: "The activity is with the student", ml: "പ്രവർത്തനം വിദ്യാർത്ഥിക്കൊപ്പമാണ്" })} detail={copy(locale, { en: "The student is choosing a maker path, creating a first design, critiquing it, and revising it. This workspace updates after submission.", ml: "വിദ്യാർത്ഥി നിർമ്മാണ മാർഗം തിരഞ്ഞെടുത്ത് ആദ്യ രൂപകൽപ്പന ഉണ്ടാക്കി പരിശോധിച്ച് തിരുത്തുകയാണ്. സമർപ്പിച്ച ശേഷം ഈ പ്രവർത്തിസ്ഥലം പുതുക്കും." })} />
          ) : cycle.status === CycleStatus.waiting_teacher_review ? (
            <section className="portal-card evidence-review-card">
              <div className="card-heading-row"><div><p className="eyebrow">{copy(locale, { en: "Evidence for review", ml: "പരിശോധിക്കാനുള്ള പഠന തെളിവ്" })}</p><h2>{copy(locale, { en: "What happened in this activity", ml: "ഈ പ്രവർത്തനത്തിൽ സംഭവിച്ചത്" })}</h2></div><span className="status-badge attention">{copy(locale, { en: "Needs review", ml: "പരിശോധിക്കണം" })}</span></div>
              <div className="evidence-timeline">
                <div><span>1</span><p>{copy(locale, { en: "First answer", ml: "ആദ്യ ഉത്തരം" })}</p><strong>{cycle.firstAnswer?.replaceAll("_", " ")}</strong></div>
                <div><span>2</span><p>{copy(locale, { en: "Support opened", ml: "പിന്തുണ ഉപയോഗിച്ചു" })}</p><strong>{cycle.selectedSupport.replaceAll("_", " ")}</strong></div>
                <div><span>3</span><p>{copy(locale, { en: "Revised answer", ml: "പുതുക്കിയ ഉത്തരം" })}</p><strong>{cycle.revisedAnswer?.replaceAll("_", " ")}</strong></div>
                <div><span>4</span><p>{copy(locale, { en: "Explanation", ml: "വിശദീകരണം" })}</p><strong>{cycle.explanationChoice?.replaceAll("_", " ")}</strong></div>
              </div>
              {cycle.makerPath && cycle.artifactDraft && cycle.artifactCritique && cycle.artifactRevision ? (
                <section className="artifact-review-panel">
                  <div className="artifact-review-heading"><PenTool aria-hidden="true" /><div><p className="eyebrow">{copy(locale, { en: "Student-owned artifact", ml: "വിദ്യാർത്ഥിയുടെ സ്വന്തം സൃഷ്ടി" })}</p><h3>{copy(locale, makerPathPresentations[cycle.makerPath].title)}</h3></div></div>
                  <div className="artifact-review-grid">
                    <article><span>1</span><h4>{copy(locale, { en: "First design", ml: "ആദ്യ രൂപകൽപ്പന" })}</h4><p>{cycle.artifactDraft}</p></article>
                    <article><span>2</span><h4>{copy(locale, { en: "Student critique", ml: "വിദ്യാർത്ഥിയുടെ പരിശോധന" })}</h4><p>{copy(locale, artifactCritiquePresentations[cycle.artifactCritique])}</p></article>
                    <article><span>3</span><h4>{copy(locale, { en: "Revision and reason", ml: "തിരുത്തലും കാരണവും" })}</h4><p>{cycle.artifactRevision}</p></article>
                  </div>
                  <small>{copy(locale, { en: "This raw artifact is visible only to the student and assigned teacher.", ml: "ഈ അസംസ്കൃത സൃഷ്ടി വിദ്യാർത്ഥിക്കും നിയുക്ത അധ്യാപകനും മാത്രം കാണാം." })}</small>
                </section>
              ) : null}
              <form action={reviewStudentEvidenceAction} className="review-form">
                <fieldset><legend>{copy(locale, { en: "Choose the next support", ml: "അടുത്ത പിന്തുണ തിരഞ്ഞെടുക്കുക" })}</legend>{supportOptions.map((option) => <label key={option.value}><input type="radio" name="nextSupport" value={option.value} defaultChecked={option.value === cycle.selectedSupport} /><span><strong>{copy(locale, option.title)}</strong><small>{copy(locale, option.detail)}</small></span></label>)}</fieldset>
                <fieldset><legend>{copy(locale, { en: "Choose how much scaffold comes next", ml: "അടുത്ത തവണ എത്ര സഹായം വേണമെന്ന് തിരഞ്ഞെടുക്കുക" })}</legend>{scaffoldOptions.map(([value, presentation]) => <label key={value}><input type="radio" name="nextScaffoldLevel" value={value} defaultChecked={value === suggestedNextScaffold} /><span><strong>{copy(locale, presentation.title)}</strong><small>{copy(locale, presentation.detail)}</small></span></label>)}</fieldset>
                <p className="scaffold-decision-note">{copy(locale, { en: "Kanni never reduces support automatically. Your choice becomes the starting level of the next cycle.", ml: "കണ്ണി സഹായം സ്വയം കുറയ്ക്കില്ല. നിങ്ങളുടെ തിരഞ്ഞെടുപ്പാണ് അടുത്ത പഠനചക്രത്തിന്റെ ആരംഭനില." })}</p>
                <button className="button primary" type="submit"><ClipboardCheck size={18} aria-hidden="true" />{copy(locale, { en: "Approve family activity and next scaffold", ml: "കുടുംബ പ്രവർത്തനവും അടുത്ത സഹായവും അംഗീകരിക്കുക" })}</button>
              </form>
            </section>
          ) : (
            <section className="portal-card completion-card">
              <CheckCircle2 aria-hidden="true" />
              <div><p className="eyebrow">{copy(locale, { en: "Teacher review complete", ml: "അധ്യാപക പരിശോധന പൂർത്തിയായി" })}</p><h2>{copy(locale, { en: "The family activity is ready", ml: "കുടുംബ പ്രവർത്തനം തയ്യാറാണ്" })}</h2><p>{cycle.familyResponse === "not_sent" ? copy(locale, { en: "The parent can now try the reviewed activity and respond.", ml: "രക്ഷിതാവിന് ഇപ്പോൾ പരിശോധിച്ച പ്രവർത്തനം ചെയ്ത് പ്രതികരിക്കാം." }) : copy(locale, { en: "The parent response has returned to the learning cycle.", ml: "രക്ഷിതാവിന്റെ പ്രതികരണം പഠനചക്രത്തിലേക്ക് തിരിച്ചെത്തി." })}</p></div>
            </section>
          )}
        </div>
      )}
    </PortalChrome>
  );
}
