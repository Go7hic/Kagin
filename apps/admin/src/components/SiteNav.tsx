import { useEffect, useId, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { getToken } from "../api";
import { BrandMark } from "./BrandMark";
import { useLocalizedPath, useT } from "../i18n";

export function SiteNav() {
  const t = useT();
  const lp = useLocalizedPath();
  const signedIn = Boolean(getToken());
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links = (
    <>
      <Link to={lp("/")} hash="features" className="kg-site-nav-link" onClick={() => setOpen(false)}>
        {t("nav.features")}
      </Link>
      <Link to={lp("/")} hash="flow" className="kg-site-nav-link" onClick={() => setOpen(false)}>
        {t("nav.howItWorks")}
      </Link>
      <Link to={lp("/pricing")} className="kg-site-nav-link" onClick={() => setOpen(false)}>
        {t("nav.pricing")}
      </Link>
      <Link to={lp("/docs/quickstart")} className="kg-site-nav-link" onClick={() => setOpen(false)}>
        {t("nav.docs")}
      </Link>
      {!signedIn ? (
        <Link to={lp("/admin/login")} className="kg-btn kg-btn-ghost" onClick={() => setOpen(false)}>
          {t("common.signIn")}
        </Link>
      ) : null}
      <Link to={lp("/admin")} className="kg-btn kg-btn-primary" onClick={() => setOpen(false)}>
        {t("common.openConsole")}
      </Link>
    </>
  );

  return (
    <header className="kg-nav-sticky">
      <div className="kg-container kg-site-nav-bar">
        <BrandMark to={lp("/")} />
        <nav className="kg-site-nav kg-site-nav--desktop" aria-label={t("nav.product")}>
          {links}
        </nav>
        <button
          type="button"
          className="kg-site-nav-toggle"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="kg-site-nav-toggle-bars" data-open={open} aria-hidden />
        </button>
      </div>
      <div
        id={menuId}
        className="kg-site-nav-panel"
        data-open={open}
        aria-hidden={!open}
      >
        <nav className="kg-site-nav kg-site-nav--mobile" aria-label={t("nav.product")}>
          {links}
        </nav>
      </div>
    </header>
  );
}
