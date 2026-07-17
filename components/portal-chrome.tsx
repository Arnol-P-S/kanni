import { CycleStatus, SchoolRole, type Locale } from "@prisma/client";
import {
  BookOpenCheck,
  House,
  LayoutDashboard,
  LogOut,
  School,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NodesMark } from "@/components/nodes-mark";
import type { Actor } from "@/lib/auth";
import { copy } from "@/lib/i18n";
import type { LearningCycleWithPeople } from "@/lib/school-data";

const roleIcons = {
  school_admin: UserRoundCog,
  teacher: School,
  student: BookOpenCheck,
  parent: House,
} as const;

const activeCycleStages: CycleStatus[] = [
  CycleStatus.draft,
  CycleStatus.active,
  CycleStatus.waiting_teacher_review,
  CycleStatus.waiting_family,
  CycleStatus.complete,
];

function roleLabel(role: SchoolRole, locale: Locale): string {
  const labels = {
    school_admin: { en: "School administrator", ml: "സ്കൂൾ അഡ്മിനിസ്ട്രേറ്റർ" },
    teacher: { en: "Teacher", ml: "അധ്യാപകൻ" },
    student: { en: "Student", ml: "വിദ്യാർത്ഥി" },
    parent: { en: "Parent", ml: "രക്ഷിതാവ്" },
  } as const;
  return copy(locale, labels[role]);
}

function stageLabel(status: CycleStatus, locale: Locale): string {
  const labels = {
    draft: { en: "Teacher planning", ml: "അധ്യാപക ആസൂത്രണം" },
    active: { en: "Student activity", ml: "വിദ്യാർത്ഥി പ്രവർത്തനം" },
    waiting_teacher_review: { en: "Teacher review", ml: "അധ്യാപക പരിശോധന" },
    waiting_family: { en: "Family activity", ml: "കുടുംബ പ്രവർത്തനം" },
    complete: { en: "Cycle complete", ml: "പഠനചക്രം പൂർത്തിയായി" },
    archived: { en: "Preserved history", ml: "സൂക്ഷിച്ച ചരിത്രം" },
  } as const;
  return copy(locale, labels[status]);
}

export function PortalChrome({
  actor,
  cycle,
  title,
  intro,
  children,
}: {
  actor: Actor;
  cycle: LearningCycleWithPeople | null;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const locale = actor.locale;
  const Icon = roleIcons[actor.role];
  const roleRoute = actor.role === SchoolRole.school_admin ? "admin" : actor.role;
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="brand app-brand" href="/" aria-label="Kanni home">
          <NodesMark className="brand-mark" />
          <span><strong>Kanni</strong><span lang="ml">കണ്ണി</span></span>
        </Link>
        <div className="school-identity">
          <span>{copy(locale, { en: "School workspace", ml: "സ്കൂൾ പ്രവർത്തിസ്ഥലം" })}</span>
          <strong>{actor.schoolName}</strong>
        </div>
        <nav className="app-navigation" aria-label="Workspace">
          <Link href={`/portal/${roleRoute}`} aria-current="page">
            <LayoutDashboard aria-hidden="true" />
            {copy(locale, { en: "Overview", ml: "അവലോകനം" })}
          </Link>
        </nav>
        <div className="sidebar-account">
          <span className="sidebar-avatar"><Icon aria-hidden="true" /></span>
          <span><strong>{actor.displayName}</strong><small>{roleLabel(actor.role, locale)}</small></span>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <a className="skip-link" href="#main-content">
            {copy(locale, { en: "Skip to content", ml: "ഉള്ളടക്കത്തിലേക്ക് കടക്കുക" })}
          </a>
          <LanguageSwitcher locale={locale} returnTo={`/portal/${roleRoute}`} />
          <form action={logoutAction}>
            <button className="button quiet compact" type="submit">
              <LogOut size={17} aria-hidden="true" />
              {copy(locale, { en: "Sign out", ml: "സൈൻ ഔട്ട്" })}
            </button>
          </form>
        </header>

        <main id="main-content" className="portal-page">
          <header className="workspace-heading">
            <div>
              <p className="eyebrow">{roleLabel(actor.role, locale)}</p>
              <h1>{title}</h1>
              <p>{intro}</p>
            </div>
          </header>

          {cycle ? (
            <section className="learning-cycle-banner" aria-label="Learning cycle status">
              <div>
                <span>{copy(locale, { en: "Learning goal", ml: "പഠനലക്ഷ്യം" })}</span>
                <strong>{cycle.goal}</strong>
              </div>
              <div>
                <span>{copy(locale, { en: "Current handoff", ml: "നിലവിലെ കൈമാറ്റം" })}</span>
                <strong>{stageLabel(cycle.status, locale)}</strong>
              </div>
              <div className="cycle-progress" aria-label={stageLabel(cycle.status, locale)}>
                {activeCycleStages.map((stage, index, all) => {
                  const currentIndex = all.indexOf(cycle.status);
                  return <span key={stage} data-complete={index <= currentIndex} />;
                })}
              </div>
            </section>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
}

export function WaitingCard({
  locale,
  title,
  detail,
}: {
  locale: Locale;
  title: string;
  detail: string;
}) {
  return (
    <section className="portal-card waiting-card">
      <p className="eyebrow">
        {copy(locale, { en: "Waiting for the previous step", ml: "മുൻ ഘട്ടത്തിനായി കാത്തിരിക്കുന്നു" })}
      </p>
      <h2>{title}</h2>
      <p>{detail}</p>
    </section>
  );
}
