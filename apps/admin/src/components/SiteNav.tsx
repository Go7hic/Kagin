import { Link } from "@tanstack/react-router";
import { BrandMark } from "./BrandMark";
import { useLocalizedPath, useT } from "../i18n";

export function SiteNav() {
  const t = useT();
  const lp = useLocalizedPath();

  return (
    <header className="kg-nav-sticky">
      <div className="kg-container kg-site-nav-bar">
        <BrandMark to={lp("/")} />
        <nav className="kg-site-nav">
          <Link to={lp("/")} hash="features" className="kg-site-nav-link">{t("nav.features")}</Link>
          <Link to={lp("/")} hash="flow" className="kg-site-nav-link">{t("nav.howItWorks")}</Link>
          <Link to={lp("/pricing")} className="kg-site-nav-link">{t("nav.pricing")}</Link>
          <Link to={lp("/docs/quickstart")} className="kg-site-nav-link">{t("nav.docs")}</Link>
          <Link to={lp("/admin/login")} className="kg-btn kg-btn-ghost">{t("common.signIn")}</Link>
          <Link to={lp("/admin")} className="kg-btn kg-btn-primary">{t("common.openConsole")}</Link>
        </nav>
      </div>
    </header>
  );
}
