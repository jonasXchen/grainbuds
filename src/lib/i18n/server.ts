import { cookies } from "next/headers";
import type { Locale } from "@/lib/types";
import { getDictionary, type Dictionary } from "./dictionaries";

export const LOCALE_COOKIE = "grainbuds-lang";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "de" ? "de" : "en";
}

export async function getT(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
