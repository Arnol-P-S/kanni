"use client";

import { ArrowRight, Building2, ShieldCheck, UserRoundCog } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { setupSchoolAction, type SetupState } from "@/app/actions/setup";

const initialState: SetupState = { status: "idle" };

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <span className="field-error">{errors[0]}</span> : null;
}

export function SetupForm() {
  const [state, action, pending] = useActionState(setupSchoolAction, initialState);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      if (passwordRef.current) passwordRef.current.value = "";
      if (confirmationRef.current) confirmationRef.current.value = "";
    }
  }, [state]);

  return (
    <form action={action} className="setup-form">
      <ol className="form-progress" aria-label="School setup progress">
        <li data-active="true"><span>1</span><strong>School</strong></li>
        <li data-active="true"><span>2</span><strong>Administrator</strong></li>
        <li><span>3</span><strong>Team</strong></li>
      </ol>

      <section className="form-section" aria-labelledby="school-details-title">
        <div className="form-section-heading">
          <Building2 aria-hidden="true" />
          <div><span>Step 1</span><h2 id="school-details-title">Name your school workspace</h2></div>
        </div>
        <label htmlFor="schoolName">School name</label>
        <input
          id="schoolName"
          name="schoolName"
          autoComplete="organization"
          defaultValue={state.fields?.schoolName ?? ""}
          minLength={3}
          maxLength={160}
          aria-invalid={Boolean(state.fieldErrors?.schoolName)}
          required
        />
        <FieldError errors={state.fieldErrors?.schoolName} />
        <p className="field-help">This name appears in every role workspace.</p>
      </section>

      <section className="form-section" aria-labelledby="admin-details-title">
        <div className="form-section-heading">
          <UserRoundCog aria-hidden="true" />
          <div><span>Step 2</span><h2 id="admin-details-title">Create the first administrator</h2></div>
        </div>
        <div className="form-grid two-columns">
          <div className="field-group">
            <label htmlFor="adminName">Full name</label>
            <input
              id="adminName"
              name="adminName"
              autoComplete="name"
              defaultValue={state.fields?.adminName ?? ""}
              minLength={2}
              maxLength={120}
              aria-invalid={Boolean(state.fieldErrors?.adminName)}
              required
            />
            <FieldError errors={state.fieldErrors?.adminName} />
          </div>
          <div className="field-group">
            <label htmlFor="setupLocale">Workspace language</label>
            <select id="setupLocale" name="locale" defaultValue={state.fields?.locale ?? "en"}>
              <option value="en">English</option>
              <option value="ml">മലയാളം</option>
            </select>
          </div>
        </div>
        <label htmlFor="setupEmail">Email</label>
        <input
          id="setupEmail"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.fields?.email ?? ""}
          maxLength={320}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
        <FieldError errors={state.fieldErrors?.email} />
        <div className="form-grid two-columns">
          <div className="field-group">
            <label htmlFor="setupPassword">Password</label>
            <input
              id="setupPassword"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              ref={passwordRef}
              aria-invalid={Boolean(state.fieldErrors?.password)}
              required
            />
            <FieldError errors={state.fieldErrors?.password} />
          </div>
          <div className="field-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              ref={confirmationRef}
              aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
              required
            />
            <FieldError errors={state.fieldErrors?.confirmPassword} />
          </div>
        </div>
        <p className="field-help">Use at least 12 characters with uppercase, lowercase, and a number.</p>
      </section>

      <div className="setup-privacy-note">
        <ShieldCheck aria-hidden="true" />
        <p><strong>No sample people are created.</strong> After setup, add only the teacher, student, and parent accounts your school needs.</p>
      </div>

      {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}
      <button className="button primary setup-submit" type="submit" disabled={pending}>
        {pending ? "Creating school…" : "Create school and continue"}
        <ArrowRight aria-hidden="true" />
      </button>
    </form>
  );
}
