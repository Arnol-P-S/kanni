import { SchoolRole } from "@prisma/client";
import type { Metadata } from "next";
import {
  Bot,
  CheckCircle2,
  Link2,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { startFreshCycleAction } from "@/app/actions/learning-cycle";
import { PortalChrome, WaitingCard } from "@/components/portal-chrome";
import { getGrowthAiCapability } from "@/lib/ai/growth-ai";
import { requireActor } from "@/lib/auth";
import { copy } from "@/lib/i18n";
import { scaffoldLevelPresentations } from "@/lib/maker-challenge";
import { getAdminWorkspace } from "@/lib/school-data";

export const metadata: Metadata = { title: "School workspace" };

const roleLabels = {
  school_admin: { en: "School administrator", ml: "സ്കൂൾ അഡ്മിനിസ്ട്രേറ്റർ" },
  teacher: { en: "Teacher", ml: "അധ്യാപകൻ" },
  student: { en: "Student", ml: "വിദ്യാർത്ഥി" },
  parent: { en: "Parent", ml: "രക്ഷിതാവ്" },
} as const;

export default async function AdminPortalPage() {
  const actor = await requireActor(SchoolRole.school_admin);
  const workspace = await getAdminWorkspace(actor);
  const locale = actor.locale;
  const cycle = workspace?.cycle ?? null;
  const ai = getGrowthAiCapability();

  return (
    <PortalChrome
      actor={actor}
      cycle={cycle}
      title={copy(locale, { en: "Keep every learning handoff moving", ml: "ഓരോ പഠന കൈമാറ്റവും മുന്നോട്ട് കൊണ്ടുപോകുക" })}
      intro={copy(locale, { en: "See who is connected, where the learning cycle is now, and which person needs to act next.", ml: "ആരാണ് ബന്ധിപ്പിച്ചിരിക്കുന്നത്, പഠനചക്രം എവിടെയാണ്, അടുത്തതായി ആരാണ് പ്രവർത്തിക്കേണ്ടത് എന്നിവ കാണുക." })}
    >
      {!workspace || !cycle ? (
        <WaitingCard
          locale={locale}
          title={copy(locale, { en: "No learning cycle is available", ml: "പഠനചക്രം ലഭ്യമല്ല" })}
          detail={copy(locale, { en: "Create a learning cycle and connect its teacher, student, and parent.", ml: "ഒരു പഠനചക്രം സൃഷ്ടിച്ച് അധ്യാപകൻ, വിദ്യാർത്ഥി, രക്ഷിതാവ് എന്നിവരെ ബന്ധിപ്പിക്കുക." })}
        />
      ) : (
        <div className="workspace-grid admin-workspace-grid">
          <section className="portal-card metric-card-row" aria-label="School connection summary">
            <article>
              <UsersRound aria-hidden="true" />
              <strong>{workspace.members.length}</strong>
              <span>{copy(locale, { en: "Active people", ml: "സജീവ അംഗങ്ങൾ" })}</span>
            </article>
            <article>
              <Link2 aria-hidden="true" />
              <strong>{workspace.teacherLinks}</strong>
              <span>{copy(locale, { en: "Teacher links", ml: "അധ്യാപക ബന്ധങ്ങൾ" })}</span>
            </article>
            <article>
              <Link2 aria-hidden="true" />
              <strong>{workspace.guardianLinks}</strong>
              <span>{copy(locale, { en: "Parent links", ml: "രക്ഷിതൃ ബന്ധങ്ങൾ" })}</span>
            </article>
          </section>

          <section className="portal-card support-circle-card">
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">{copy(locale, { en: "Current support circle", ml: "നിലവിലെ പിന്തുണാ വലം" })}</p>
                <h2>{cycle.title}</h2>
              </div>
              <span className="status-badge success"><CheckCircle2 aria-hidden="true" />{copy(locale, { en: "Connected", ml: "ബന്ധിപ്പിച്ചു" })}</span>
            </div>
            <div className="support-circle-list">
              <div><span>{copy(locale, { en: "Teacher", ml: "അധ്യാപകൻ" })}</span><strong>{cycle.teacherMembership.user.displayName}</strong></div>
              <div><span>{copy(locale, { en: "Student", ml: "വിദ്യാർത്ഥി" })}</span><strong>{cycle.studentMembership.user.displayName}</strong></div>
              <div><span>{copy(locale, { en: "Parent", ml: "രക്ഷിതാവ്" })}</span><strong>{cycle.guardianMembership?.user.displayName ?? copy(locale, { en: "Not assigned", ml: "നിയമിച്ചിട്ടില്ല" })}</strong></div>
              <div><span>{copy(locale, { en: "Family language", ml: "കുടുംബ ഭാഷ" })}</span><strong>{cycle.familyLocale === "ml" ? "മലയാളം" : "English"}</strong></div>
              <div><span>{copy(locale, { en: "Current scaffold", ml: "നിലവിലെ സഹായഘടന" })}</span><strong>{copy(locale, scaffoldLevelPresentations[cycle.scaffoldLevel].title)}</strong></div>
            </div>
          </section>

          <section className="portal-card ai-governance-card">
            <div className="card-heading-row"><div><p className="eyebrow">{copy(locale, { en: "AI governance", ml: "AI ഭരണനിയന്ത്രണം" })}</p><h2>{copy(locale, { en: "Bounded by the learning cycle", ml: "പഠനചക്രത്തിന്റെ പരിധിയിൽ" })}</h2></div><span className={`status-badge ${ai.available ? "success" : "attention"}`}><Bot aria-hidden="true" />{ai.available ? copy(locale, { en: "Available", ml: "ലഭ്യമാണ്" }) : copy(locale, { en: "Fallback active", ml: "പകരം പിന്തുണ സജീവം" })}</span></div>
            <div className="governance-list">
              <div><ShieldCheck aria-hidden="true" /><span><strong>{copy(locale, { en: "Two bounded AI moments", ml: "പരിധിയുള്ള രണ്ട് AI ഘട്ടങ്ങൾ" })}</strong><small>{copy(locale, { en: "One teacher draft and one student scaffold per learning cycle.", ml: "ഓരോ പഠനചക്രത്തിലും ഒരു അധ്യാപക കരടും ഒരു വിദ്യാർത്ഥി പിന്തുണയും." })}</small></span></div>
              <div><ShieldCheck aria-hidden="true" /><span><strong>{copy(locale, { en: "Reviewed curriculum only", ml: "പരിശോധിച്ച പാഠഭാഗം മാത്രം" })}</strong><small>{copy(locale, { en: "Generated text is hidden if its source IDs or safety checks fail.", ml: "ഉറവിട ഐഡികളോ സുരക്ഷാ പരിശോധനകളോ പരാജയപ്പെട്ടാൽ സൃഷ്ടിച്ച എഴുത്ത് മറയ്ക്കും." })}</small></span></div>
              <div><ShieldCheck aria-hidden="true" /><span><strong>{copy(locale, { en: "Teacher-controlled fading", ml: "അധ്യാപകൻ നിയന്ത്രിക്കുന്ന സഹായക്കുറവ്" })}</strong><small>{copy(locale, { en: "Only the assigned teacher can reduce the next scaffold from guided to light or independent.", ml: "അടുത്ത സഹായം വഴികാട്ടിയോടെയുള്ളതിൽ നിന്ന് ലഘുവായതിലേക്കോ സ്വതന്ത്രമായതിലേക്കോ കുറയ്ക്കാൻ നിയുക്ത അധ്യാപകനു മാത്രമേ കഴിയൂ." })}</small></span></div>
              <div><ShieldCheck aria-hidden="true" /><span><strong>{copy(locale, { en: "No raw learner conversation or artifact", ml: "അസംസ്കൃത സംഭാഷണമോ സൃഷ്ടിയോ ഇല്ല" })}</strong><small>{copy(locale, { en: "Parents and administrators receive workflow status, not student prompts, transcripts, or raw artifact text.", ml: "രക്ഷിതാക്കൾക്കും അഡ്മിനിസ്ട്രേറ്റർമാർക്കും പ്രവർത്തനനില മാത്രമാണ് ലഭിക്കുക; വിദ്യാർത്ഥിയുടെ പ്രോംപ്റ്റ്, സംഭാഷണം, അസംസ്കൃത സൃഷ്ടി എഴുത്ത് എന്നിവയല്ല." })}</small></span></div>
            </div>
            <p className="governance-model">{copy(locale, { en: `Configured model: ${ai.model}`, ml: `ക്രമീകരിച്ച മോഡൽ: ${ai.model}` })}</p>
          </section>

          <section className="portal-card people-card">
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">{copy(locale, { en: "People and access", ml: "അംഗങ്ങളും പ്രവേശനവും" })}</p>
                <h2>{copy(locale, { en: "School accounts", ml: "സ്കൂൾ അക്കൗണ്ടുകൾ" })}</h2>
              </div>
            </div>
            <div className="table-wrap" tabIndex={0} aria-label="School accounts">
              <table aria-label="School accounts">
                <thead><tr><th>{copy(locale, { en: "Person", ml: "വ്യക്തി" })}</th><th>{copy(locale, { en: "Role", ml: "ചുമതല" })}</th><th>{copy(locale, { en: "Sign-in email", ml: "സൈൻ ഇൻ ഇമെയിൽ" })}</th><th>{copy(locale, { en: "Language", ml: "ഭാഷ" })}</th></tr></thead>
                <tbody>
                  {workspace.members.map((member) => (
                    <tr key={member.id}>
                      <td><strong>{member.user.displayName}</strong></td>
                      <td>{copy(locale, roleLabels[member.role])}</td>
                      <td>{member.user.email}</td>
                      <td>{member.user.locale === "ml" ? "മലയാളം" : "English"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="portal-card admin-cycle-actions">
            <div>
              <p className="eyebrow">{copy(locale, { en: "Cycle control", ml: "പഠനചക്ര നിയന്ത്രണം" })}</p>
              <h2>{copy(locale, { en: "Start this goal again", ml: "ഈ ലക്ഷ്യം വീണ്ടും ആരംഭിക്കുക" })}</h2>
              <p>{copy(locale, { en: "Kanni preserves the current cycle, then opens the same goal for teacher planning with the existing support circle.", ml: "നിലവിലെ പഠനചക്രം കണ്ണി സൂക്ഷിച്ച ശേഷം, അതേ പിന്തുണാ വലയത്തോടെ അധ്യാപക ആസൂത്രണത്തിനായി ലക്ഷ്യം വീണ്ടും തുറക്കും." })}</p>
              <p><strong>{copy(locale, { en: `${workspace.archivedCycleCount} previous cycles preserved`, ml: `${workspace.archivedCycleCount} മുൻ പഠനചക്രങ്ങൾ സൂക്ഷിച്ചു` })}</strong></p>
            </div>
            <form action={startFreshCycleAction}>
              <button className="button secondary" type="submit">
                <RefreshCw size={18} aria-hidden="true" />
                {copy(locale, { en: "Start fresh cycle", ml: "പുതിയ പഠനചക്രം ആരംഭിക്കുക" })}
              </button>
            </form>
          </section>
        </div>
      )}
    </PortalChrome>
  );
}
