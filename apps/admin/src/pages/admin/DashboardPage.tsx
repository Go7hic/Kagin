import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { ActionList, EmptyState, PageHeader, Panel } from "../../components/Panel";
import { useLocalizedPath, useMessages, useT } from "../../i18n";

export function DashboardPage() {
  const t = useT();
  const messages = useMessages();
  const lp = useLocalizedPath();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const products = useQuery({ queryKey: ["products"], queryFn: api.listProducts });
  const licenses = useQuery({ queryKey: ["licenses"], queryFn: () => api.listLicenses() });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: api.listSessions });

  const recentSessions = (sessions.data ?? []).slice(0, 8);
  const activeLicenses = (licenses.data ?? []).filter((l) => l.status === "active").length;
  const healthy = health.data?.ok;

  return (
    <div className="kg-stack-6">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        actions={
          <>
            <Link to={lp("/admin/licenses")} className="kg-btn kg-btn-secondary">{t("dashboard.issueLicense")}</Link>
            <Link to={lp("/admin/products")} className="kg-btn kg-btn-primary">{t("dashboard.newProduct")}</Link>
          </>
        }
      />

      <div className="kg-stats-row">
        <div className="kg-stat-card">
          <span className="kg-stat-value kg-stat-value--text">
            <span className="kg-stat-health">
              <span className={`kg-stat-health-dot ${healthy ? "kg-stat-health-dot--ok" : "kg-stat-health-dot--bad"}`} />
              {health.isLoading ? "…" : healthy ? t("common.healthy") : t("common.down")}
            </span>
          </span>
          <span className="kg-stat-label">{t("dashboard.apiStatus")}</span>
        </div>
        <div className="kg-stat-card">
          <span className="kg-stat-value">{products.data?.length ?? t("common.dash")}</span>
          <span className="kg-stat-label">{t("dashboard.products")}</span>
        </div>
        <div className="kg-stat-card">
          <span className="kg-stat-value">{licenses.data?.length ?? t("common.dash")}</span>
          <span className="kg-stat-label">{t("dashboard.totalLicenses")}</span>
        </div>
        <div className="kg-stat-card">
          <span className="kg-stat-value">{sessions.data?.length ?? t("common.dash")}</span>
          <span className="kg-stat-label">{t("dashboard.recentSessions")}</span>
        </div>
      </div>

      <div className="kg-dashboard-grid">
        <Panel
          title={t("dashboard.recentSessionsTitle")}
          description={t("dashboard.recentSessionsDesc", {
            shown: recentSessions.length,
            total: sessions.data?.length ?? 0,
          })}
          flush
          footer={
            recentSessions.length > 0 ? (
              <>
                {t("dashboard.recentSessionsFooter")}{" "}
                <Link to={lp("/admin/sessions")}>{t("dashboard.viewAllSessions")}</Link>
              </>
            ) : undefined
          }
        >
          {recentSessions.length === 0 ? (
            <EmptyState
              title={t("dashboard.noSessionsTitle")}
              body={t("dashboard.noSessionsBody")}
            />
          ) : (
            <div className="kg-table-wrap">
              <table className="kg-table">
                <thead>
                  <tr>
                    <th scope="col">{t("dashboard.table.license")}</th>
                    <th scope="col">{t("dashboard.table.machine")}</th>
                    <th scope="col" className="kg-numeric">{t("dashboard.table.lastHb")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((s) => (
                    <tr key={s.session_id as string}>
                      <td className="kg-mono" title={s.license_key as string}>{s.license_key as string}</td>
                      <td className="kg-mono">{s.machine_id as string}</td>
                      <td className="kg-numeric kg-mono">{s.last_heartbeat as number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          title={t("dashboard.quickActions")}
          flush
          footer={
            <>
              {t("dashboard.activeLicensesFooter", {
                active: activeLicenses,
                products: products.data?.length ?? 0,
              })}
            </>
          }
        >
          <ActionList
            items={[
              { to: "/admin/products", label: messages.dashboard.quickActionsItems[0] },
              { to: "/admin/licenses", label: messages.dashboard.quickActionsItems[1] },
              { to: "/admin/policies", label: messages.dashboard.quickActionsItems[2] },
              { to: "/admin/sessions", label: messages.dashboard.quickActionsItems[3] },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
