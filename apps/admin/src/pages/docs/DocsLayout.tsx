import { Link, Outlet, useParams } from "@tanstack/react-router";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteNav } from "../../components/SiteNav";
import { docSections, getDocs, isDocSection, type DocSection } from "../../i18n/docs";
import { useLocale, useLocalizedPath } from "../../i18n";

export function DocsLayout() {
  const locale = useLocale();
  const lp = useLocalizedPath();
  const docs = getDocs(locale);
  const { section } = useParams({ strict: false });
  const active = isDocSection(section ?? "") ? section : "quickstart";

  return (
    <div className="kg-shell kg-docs">
      <SiteNav />

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
