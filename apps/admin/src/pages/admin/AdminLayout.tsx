import { Link, Outlet } from "@tanstack/react-router";
import { BrandMark } from "../../components/BrandMark";
import { SidebarUserMenu } from "../../components/SidebarUserMenu";
import {
  IconActivity,
  IconBox,
  IconCard,
  IconGrid,
  IconSliders,
  IconTicket,
  IconKey,
} from "../../components/Icons";
import { useLocalizedPath, useT } from "../../i18n";

export function AdminLayout() {
  const t = useT();
  const lp = useLocalizedPath();

  const nav = [
    { to: "/admin", label: t("admin.nav.overview"), exact: true, icon: IconGrid },
    { to: "/admin/products", label: t("admin.nav.products"), icon: IconBox },
    { to: "/admin/licenses", label: t("admin.nav.licenses"), icon: IconTicket },
    { to: "/admin/policies", label: t("admin.nav.policies"), icon: IconSliders },
    { to: "/admin/sessions", label: t("admin.nav.sessions"), icon: IconActivity },
    { to: "/admin/api-keys", label: t("admin.nav.apiKeys"), icon: IconKey },
    { to: "/admin/billing", label: t("admin.nav.billing"), icon: IconCard },
  ];

  return (
    <div className="kg-admin">
      <aside className="kg-sidebar">
        <div className="kg-sidebar-brand">
          <BrandMark to={lp("/")} />
        </div>
        <p className="kg-sidebar-section">{t("admin.manage")}</p>
        <nav className="kg-sidebar-nav">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={lp(item.to)}
              className="kg-nav-link"
              activeOptions={{ exact: item.exact ?? false }}
              activeProps={{ "data-active": true }}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="kg-sidebar-footer">
          <SidebarUserMenu />
        </div>
      </aside>
      <div className="kg-admin-main">
        <header className="kg-admin-header">
          <div className="kg-admin-header-actions">
            <Link to={lp("/docs/quickstart")} className="kg-btn kg-btn-ghost">{t("nav.docs")}</Link>
            <Link to={lp("/")} className="kg-btn kg-btn-ghost">{t("common.backToSite")}</Link>
          </div>
        </header>
        <div className="kg-admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
