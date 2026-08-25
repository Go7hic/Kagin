export const locales = ["en", "zh", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
};

export const localeHtmlLang: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  ja: "ja",
};

export type Messages = typeof import("./locales/en").en;
