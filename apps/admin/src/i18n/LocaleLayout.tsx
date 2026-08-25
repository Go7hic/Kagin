import { Outlet, useParams } from "@tanstack/react-router";
import { isLocale } from "./core";
import { LocaleProvider } from "./LocaleProvider";
import { defaultLocale } from "./types";

export function LocaleLayout() {
  const { locale: raw } = useParams({ strict: false });
  const locale = raw && isLocale(raw) ? raw : defaultLocale;

  return (
    <LocaleProvider locale={locale}>
      <Outlet />
    </LocaleProvider>
  );
}
