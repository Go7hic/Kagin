import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  detectLocale,
  isLocale,
  localizedPath,
  persistLocale,
  stripLocalePrefix,
} from "../i18n/core";
import type { Locale } from "../i18n/types";

export function useCurrentLocale(): Locale {
  const location = useLocation();
  const segment = location.pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : detectLocale();
}

export function useSwitchLocale() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = useCurrentLocale();

  return (next: Locale) => {
    if (next === current) return;
    persistLocale(next);
    navigate({ to: localizedPath(next, stripLocalePrefix(location.pathname)) });
  };
}
