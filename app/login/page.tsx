import type { Metadata } from "next";
import { BookOpenCheck, House, School, UserRoundCog } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { getCurrentActor, homeForRole } from "@/lib/auth";
import { copy, getRequestLocale } from "@/lib/i18n";
import { isInstallationConfigured } from "@/lib/installation";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Kanni school workspace.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!(await isInstallationConfigured())) redirect("/setup");
  const actor = await getCurrentActor();
  if (actor) redirect(homeForRole(actor.role));
  const locale = await getRequestLocale();
  const { notice } = await searchParams;

  return (
    <>
      <PublicHeader locale={locale} returnTo="/login" />
      <main id="main-content" className="login-layout page-shell">
        <section className="login-product-panel">
          <p className="eyebrow">
            {copy(locale, { en: "Welcome back", ml: "വീണ്ടും സ്വാഗതം" })}
          </p>
          <h1>
            {copy(locale, {
              en: "Your next task is ready.",
              ml: "നിങ്ങളുടെ അടുത്ത പ്രവർത്തി തയ്യാറാണ്.",
            })}
          </h1>
          <p>
            {copy(locale, {
              en: "Use your school account. Kanni will open the workspace connected to your role and learning circle.",
              ml: "നിങ്ങളുടെ സ്കൂൾ അക്കൗണ്ട് ഉപയോഗിക്കുക. നിങ്ങളുടെ ചുമതലയ്ക്കും പഠനവലയത്തിനും അനുയോജ്യമായ പ്രവർത്തിസ്ഥലം കണ്ണി തുറക്കും.",
            })}
          </p>
          <div className="login-role-row" aria-label="Kanni workspaces">
            <span><UserRoundCog aria-hidden="true" />{copy(locale, { en: "School", ml: "സ്കൂൾ" })}</span>
            <span><School aria-hidden="true" />{copy(locale, { en: "Teacher", ml: "അധ്യാപകൻ" })}</span>
            <span><BookOpenCheck aria-hidden="true" />{copy(locale, { en: "Student", ml: "വിദ്യാർത്ഥി" })}</span>
            <span><House aria-hidden="true" />{copy(locale, { en: "Parent", ml: "രക്ഷിതാവ്" })}</span>
          </div>
        </section>

        <section className="login-card" aria-labelledby="sign-in-title">
          <div className="login-card-heading">
            <h2 id="sign-in-title">{copy(locale, { en: "Sign in", ml: "സൈൻ ഇൻ" })}</h2>
            <p>{copy(locale, { en: "Enter the email and password issued by your school.", ml: "സ്കൂൾ നൽകിയ ഇമെയിലും പാസ്‌വേഡും നൽകുക." })}</p>
          </div>
          {notice === "signed-out" ? (
            <p className="form-notice" role="status">
              {copy(locale, { en: "You have signed out.", ml: "നിങ്ങൾ സൈൻ ഔട്ട് ചെയ്തു." })}
            </p>
          ) : notice === "session-required" ? (
            <p className="form-notice" role="status">
              {copy(locale, { en: "Sign in to continue.", ml: "തുടരാൻ സൈൻ ഇൻ ചെയ്യുക." })}
            </p>
          ) : notice === "school-created" ? (
            <p className="form-notice" role="status">Your school is ready. Sign in with the administrator account you created.</p>
          ) : notice === "school-ready" ? (
            <p className="form-notice" role="status">This school is already set up. Sign in to continue.</p>
          ) : null}
          <LoginForm
            copy={{
              email: copy(locale, { en: "Email", ml: "ഇമെയിൽ" }),
              password: copy(locale, { en: "Password", ml: "പാസ്‌വേഡ്" }),
              submit: copy(locale, { en: "Open workspace", ml: "പ്രവർത്തിസ്ഥലം തുറക്കുക" }),
            }}
          />
        </section>
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
