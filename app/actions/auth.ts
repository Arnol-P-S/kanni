"use server";

import { redirect } from "next/navigation";

import {
  AuthenticationError,
  LoginInputSchema,
  homeForRole,
  loginWithPassword,
  logout,
} from "@/lib/auth";

export type LoginState = {
  message?: string;
  fields?: { email?: string };
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      message: "Enter a valid email address and password.",
      fields: { email: String(formData.get("email") ?? "") },
    };
  }

  let destination = "/portal";
  try {
    const actor = await loginWithPassword(parsed.data);
    destination = homeForRole(actor.role);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      const message =
        error.code === "rate_limited"
          ? "Too many attempts. Wait 15 minutes before trying again."
          : error.code === "configuration"
            ? "Sign-in is not configured on this server."
            : "The email or password is incorrect.";
      return { message, fields: { email: parsed.data.email } };
    }
    return {
      message: "Sign-in is temporarily unavailable. Please try again.",
      fields: { email: parsed.data.email },
    };
  }
  redirect(destination);
}

export async function logoutAction(): Promise<never> {
  await logout();
  redirect("/login?notice=signed-out");
}
