import { createContext, useContext, useEffect, type ReactNode } from "react";
import { getMessages, localizedPath } from "./core";
import { defaultLocale, localeHtmlLang, type Locale, type Messages } from "./types";
import { en } from "./locales/en";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  messages: en,
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const messages = getMessages(locale);

  useEffect(() => {
    document.documentElement.lang = localeHtmlLang[locale];
    document.title = `Kagin — ${messages.meta.tagline}`;
  }, [locale, messages.meta.tagline]);

  return (
    <LocaleContext.Provider value={{ locale, messages }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext).locale;
}

export function useMessages() {
  return useContext(LocaleContext).messages;
}

export function useT() {
  const { messages } = useContext(LocaleContext);
  return (key: string, vars?: Record<string, string | number>) => {
    const value = key.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, messages);
    if (typeof value !== "string") return key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
  };
}

export function useLocalizedPath() {
  const locale = useLocale();
  return (path: string) => localizedPath(locale, path);
}
