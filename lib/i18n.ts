import { Locale } from "@prisma/client";
import { cookies } from "next/headers";

export const LOCALE_COOKIE = "kanni_locale";

export type CopyPair = { en: string; ml: string };

export function copy(locale: Locale, value: CopyPair): string {
  return value[locale];
}

export async function getRequestLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  return stored === Locale.ml ? Locale.ml : Locale.en;
}
