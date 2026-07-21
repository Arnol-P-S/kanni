import { SchoolRole, StudioStatus, type Locale } from "@prisma/client";
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
import type { PortalStudioSummary } from "@/lib/school-data";
import { studioProgress } from "@/lib/studio/workflow";

const roleIcons = {
  school_admin: UserRoundCog,
  teacher: School,
  student: BookOpenCheck,
  parent: House,
} as const;

const activeStudioStages: StudioStatus[] = [
  StudioStatus.planning,
  StudioStatus.ready_for_student,
  StudioStatus.awaiting_teacher_review,
  StudioStatus.ready_for_family,
  StudioStatus.complete,
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

export function studioStageLabel(status: StudioStatus, locale: Locale): string {
  const labels = {
    planning: { en: "Teacher planning", ml: "അധ്യാപക ആസൂത്രണം" },
    ready_for_student: { en: "Student creating", ml: "വിദ്യാർത്ഥി സൃഷ്ടിക്കുന്നു" },
    awaiting_teacher_review: { en: "Teacher evidence review", ml: "അധ്യാപക തെളിവ് പരിശോധന" },
    ready_for_family: { en: "Family activity", ml: "കുടുംബ പ്രവർത്തനം" },
    complete: { en: "Learning loop complete", ml: "പഠനചക്രം പൂർത്തിയായി" },
    archived: { en: "Archived", ml: "ശേഖരിച്ചു" },
  } as const;
  return copy(locale, labels[status]);
}

function workspaceLabel(role: SchoolRole, locale: Locale): string {
  const labels = {
    school_admin: { en: "School setup", ml: "സ്കൂൾ ക്രമീകരണം" },
    teacher: { en: "Learning studios", ml: "പഠന സ്റ്റുഡിയോകൾ" },
    student: { en: "My learning work", ml: "എന്റെ പഠനപ്രവർത്തി" },
    parent: { en: "Home connection", ml: "വീട്ടിലെ ബന്ധം" },
  } as const;
  return copy(locale, labels[role]);
}

export function PortalChrome({
  actor,
  studio,
  title,
  intro,
  children,
}: {
  actor: Actor;
  studio: PortalStudioSummary | null;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const locale = actor.locale;
  const Icon = roleIcons[actor.role];
  const roleRoute = actor.role === SchoolRole.school_admin ? "admin" : actor.role;
  const progress = studio ? studioProgress(studio.status) : 0;

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
            {workspaceLabel(actor.role, locale)}
          </Link>
        </nav>
        <div className="sidebar-principle">
          <span>{copy(locale, { en: "Kanni principle", ml: "കണ്ണിയുടെ തത്വം" })}</span>
          <p>{copy(locale, { en: "AI prepares support. People make the learning decisions.", ml: "AI പിന്തുണ തയ്യാറാക്കുന്നു. പഠനതീരുമാനങ്ങൾ ആളുകൾ എടുക്കുന്നു." })}</p>
        </div>
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

          {studio ? (
            <section className="studio-status-banner" aria-label="Learning studio progress">
              <div className="studio-status-copy">
                <span>{studio.title}</span>
                <strong>{studio.goal}</strong>
              </div>
              <div className="studio-stage-copy">
                <span>{copy(locale, { en: "Now", ml: "ഇപ്പോൾ" })}</span>
                <strong>{studioStageLabel(studio.status, locale)}</strong>
              </div>
              <div
                className="studio-progress"
                role="progressbar"
                aria-label={studioStageLabel(studio.status, locale)}
                aria-valuemin={1}
                aria-valuemax={activeStudioStages.length}
                aria-valuenow={Math.max(1, progress)}
              >
                {activeStudioStages.map((stage, index) => (
                  <span key={stage} data-complete={index < progress} />
                ))}
              </div>
            </section>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
}

export function EmptyWorkspace({
  eyebrow = "Next step",
  title,
  detail,
  children,
}: {
  eyebrow?: string;
  title: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <section className="portal-card empty-workspace">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{detail}</p>
      {children}
    </section>
  );
}
