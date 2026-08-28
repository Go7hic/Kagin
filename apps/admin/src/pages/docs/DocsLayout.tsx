import { Link, Outlet, useParams } from "@tanstack/react-router";
import { getToken } from "../../api";
import { BrandMark } from "../../components/BrandMark";
import { SiteFooter } from "../../components/SiteFooter";
import { docSections, getDocs, isDocSection, type DocSection } from "../../i18n/docs";
import { useLocale, useLocalizedPath, useT } from "../../i18n";

export function DocsLayout() {
  const locale = useLocale();
  const lp = useLocalizedPath();
  const t = useT();
  const docs = getDocs(locale);
  const { section } = useParams({ strict: false });
  const active = isDocSection(section ?? "") ? section : "quickstart";
  const signedIn = Boolean(getToken());

  return (
    <div className="kg-shell kg-docs">
      <header className="kg-nav-sticky">
        <div className="kg-container kg-site-nav-bar">
          <BrandMark to={lp("/")} />
          <nav className="kg-site-nav">
            <Link to={lp("/docs/quickstart")} className="kg-site-nav-link">
              {docs.title}
            </Link>
            <Link to={lp("/pricing")} className="kg-site-nav-link">{t("nav.pricing")}</Link>
            {!signedIn ? (
              <Link to={lp("/admin/login")} className="kg-btn kg-btn-ghost">{t("common.signIn")}</Link>
            ) : null}
            <Link to={lp("/admin")} className="kg-btn kg-btn-primary">{t("common.openConsole")}</Link>
          </nav>
        </div>
      </header>

      <div className="kg-container kg-docs-body">
        <aside className="kg-docs-sidebar">
          <p className="kg-docs-sidebar-title">{docs.title}</p>
          <p className="kg-docs-sidebar-lede">{docs.subtitle}</p>
          <nav className="kg-docs-nav">
            {docSections.map((id) => (
              <Link
                key={id}
                to={lp(`/docs/${id}`)}
                className="kg-docs-nav-link"
                data-active={active === id}
              >
                {docs.nav[id as DocSection]}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="kg-docs-main">
          <Outlet />
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
