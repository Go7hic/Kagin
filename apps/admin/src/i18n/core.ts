import { en } from "./locales/en";
import { ja } from "./locales/ja";
import { zh } from "./locales/zh";
import { defaultLocale, locales, type Locale, type Messages } from "./types";

const LOCALE_KEY = "kagin-locale";

const catalogs: Record<Locale, Messages> = { en, zh: zh as Messages, ja: ja as Messages };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs[defaultLocale];
}

export function detectLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && isLocale(stored)) return stored;
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("zh")) return "zh";
    if (lang.startsWith("ja")) return "ja";
  }
  return defaultLocale;
}

export function persistLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale);
}

export function localizedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(en|zh|ja)(\/.*)?$/);
  if (!match) return pathname;
  return match[2] || "/";
}
