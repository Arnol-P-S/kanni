"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { loginAction, type LoginState } from "@/app/actions/auth";

type ReviewAccount = {
  roleLabel: string;
  email: string;
  localPassword: string;
};

const initialState: LoginState = {};

export function LoginForm({
  accounts,
  copy,
}: {
  accounts: readonly ReviewAccount[];
  copy: {
    email: string;
    password: string;
    submit: string;
    reviewTitle: string;
    reviewDetail: string;
    useAccount: string;
  };
}) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.message && passwordRef.current) passwordRef.current.value = "";
  }, [state]);

  return (
    <div className="login-form-stack">
      <form action={action} className="credential-form">
        <label htmlFor="email">{copy.email}</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.fields?.email ?? ""}
          ref={emailRef}
          required
        />
        <label htmlFor="password">{copy.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          ref={passwordRef}
          required
        />
        {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}
        <button className="button primary login-button" type="submit" disabled={pending}>
          <KeyRound size={18} aria-hidden="true" />
          {pending ? "…" : copy.submit}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>

      {accounts.length > 0 ? (
        <aside className="review-access-card">
          <div>
            <p className="eyebrow">{copy.reviewTitle}</p>
            <p>{copy.reviewDetail}</p>
          </div>
          <div className="review-account-list">
            {accounts.map((account) => (
              <button
                type="button"
                key={account.email}
                onClick={() => {
                  if (emailRef.current) emailRef.current.value = account.email;
                  if (passwordRef.current) {
                    passwordRef.current.value = account.localPassword;
                  }
                  emailRef.current?.focus();
                }}
              >
                <span><strong>{account.roleLabel}</strong><small>{account.email}</small></span>
                <span>{copy.useAccount}</span>
              </button>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
