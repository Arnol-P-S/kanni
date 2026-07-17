"use server";

import { Locale } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentActor } from "@/lib/auth";
import { db } from "@/lib/db";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { safeInternalPath } from "@/lib/navigation";

const LocaleInputSchema = z.object({
  locale: z.enum([Locale.en, Locale.ml]),
  returnTo: z.string().max(300).default("/"),
});

export async function setLocaleAction(formData: FormData): Promise<never> {
  const parsed = LocaleInputSchema.safeParse({
    locale: formData.get("locale"),
    returnTo: formData.get("returnTo") ?? "/",
  });
  if (!parsed.success) redirect("/");

  const actor = await getCurrentActor();
  if (actor) {
    await db.user.update({
      where: { id: actor.userId },
      data: { locale: parsed.data.locale },
    });
  }
  (await cookies()).set(LOCALE_COOKIE, parsed.data.locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  redirect(safeInternalPath(parsed.data.returnTo));
}
