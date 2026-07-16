import type { Metadata } from "next";
import {
  BookOpenCheck,
  House,
  School,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

import { loginDemo } from "@/app/actions/demo";
import { demoPersonaList } from "@/lib/demo-fixtures";

export const metadata: Metadata = { title: "Synthetic demo login" };

const roleIcons = {
  tenant_admin: UserRoundCog,
  teacher: School,
  student: BookOpenCheck,
  guardian: House,
} as const;

const noticeCopy: Record<string, string> = {
  "session-required": "Choose a synthetic profile to enter the demo.",
  "confirmation-required":
    "Adult confirmation and one synthetic profile are required.",
  "account-switched": "The previous synthetic session has ended.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <main id="main-content" className="page-shell login-page">
      <header className="login-heading">
        <p className="eyebrow">Four people · one learning goal</p>
        <h1>Choose a synthetic Kanni perspective</h1>
        <p>
          Each profile sees a different authorized part of the same learning
          cycle. These are fictional accounts for adult testing only.
        </p>
      </header>

      {notice && noticeCopy[notice] ? (
        <p className="form-notice" role="status">{noticeCopy[notice]}</p>
      ) : null}

      <form action={loginDemo} className="persona-form">
        <fieldset>
          <legend>Select one demo profile</legend>
          <div className="persona-grid">
            {demoPersonaList.map((persona) => {
              const Icon = roleIcons[persona.role];
              return (
                <label className="persona-card" key={persona.id}>
                  <input
                    type="radio"
                    name="personaId"
                    value={persona.id}
                    required
                  />
                  <span className="persona-card-body">
                    <span className="persona-icon" aria-hidden="true"><Icon /></span>
                    <span>
                      <strong>{persona.displayName}</strong>
                      <small>{persona.roleLabel}</small>
                    </span>
                    <span className="persona-description">{persona.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="adult-confirmation">
          <input type="checkbox" name="adultConfirmed" required />
          <span>
            <strong>I am 18 or older.</strong>
            I am testing this prototype myself. I will not enter real learner or
            family information.
          </span>
        </label>

        <button className="button primary login-submit" type="submit">
          Enter synthetic workspace
        </button>
      </form>

      <aside className="login-boundary">
        <ShieldCheck size={22} aria-hidden="true" />
        <p>
          This flow demonstrates sessions and role checks. It is not open
          registration, school SSO, or proof of a person’s real identity.
        </p>
      </aside>
    </main>
  );
}
