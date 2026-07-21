"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export function LoginForm({
  copy,
}: {
  copy: {
    email: string;
    password: string;
    submit: string;
  };
}) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.message && passwordRef.current) passwordRef.current.value = "";
  }, [state]);

  return (
    <form action={action} className="credential-form">
      <label htmlFor="email">{copy.email}</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.fields?.email ?? ""}
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
  );
}
