import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, clearToken } from "../api";
import { localeLabels, locales } from "../i18n";
import { useCurrentLocale, useSwitchLocale } from "../i18n/useSwitchLocale";
import { useLocalizedPath, useT } from "../i18n";

function userInitial(label: string) {
  const ch = label.trim()[0];
  return ch ? ch.toUpperCase() : "?";
}

export function SidebarUserMenu() {
  const t = useT();
  const lp = useLocalizedPath();
  const navigate = useNavigate();
  const switchLocale = useSwitchLocale();
  const currentLocale = useCurrentLocale();
  const [open, setOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    staleTime: 60_000,
  });

  const user = data?.user as { email?: string } | undefined;
  const org = data?.org as { name?: string; org_id?: string; slug?: string } | undefined;
  const email = user?.email ?? (data?.mode === "legacy" ? "Admin" : "—");
  const orgLabel = org?.name ?? org?.slug ?? (data?.org_id as string | undefined) ?? "";

  useEffect(() => {
    if (!open) setLocaleOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (localeOpen) setLocaleOpen(false);
      else setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, localeOpen]);

  async function signOut() {
    setOpen(false);
    await api.logout().catch(() => {});
    clearToken();
    navigate({ to: lp("/admin/login") });
  }

  return (
    <div className="kg-user-menu" ref={rootRef}>
      <button
        type="button"
        className="kg-user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="kg-user-avatar" aria-hidden>{userInitial(email)}</span>
        <span className="kg-user-meta">
          <span className="kg-user-email">{email}</span>
          {orgLabel ? <span className="kg-user-org">{orgLabel}</span> : null}
        </span>
      </button>

      {open && (
        <div className="kg-user-menu-popover" role="menu">
          <div className="kg-user-menu-head">
            <span className="kg-user-email">{email}</span>
            {orgLabel ? <span className="kg-user-org">{orgLabel}</span> : null}
          </div>

          <div className="kg-user-menu-locale-row">
            <button
              type="button"
              className="kg-user-menu-item kg-user-menu-locale-trigger"
              aria-expanded={localeOpen}
              aria-haspopup="menu"
              onClick={() => setLocaleOpen((v) => !v)}
            >
              <span className="kg-user-menu-locale-label">{t("admin.switchLanguage")}</span>
              <span className="kg-user-menu-locale-value">
                {localeLabels[currentLocale]}
                <span className="kg-user-menu-chevron" aria-hidden>›</span>
              </span>
            </button>

            {localeOpen && (
              <div className="kg-user-menu-locale-flyout" role="menu">
                {locales.map((locale) => (
                  <button
                    key={locale}
                    type="button"
                    role="menuitemradio"
                    aria-checked={locale === currentLocale}
                    className="kg-user-menu-item"
                    data-active={locale === currentLocale}
                    onClick={() => {
                      switchLocale(locale);
                      setLocaleOpen(false);
                      setOpen(false);
                    }}
                  >
                    {localeLabels[locale]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="kg-user-menu-divider" />

          <button
            type="button"
            role="menuitem"
            className="kg-user-menu-item kg-user-menu-item--signout"
            onClick={signOut}
          >
            {t("common.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
