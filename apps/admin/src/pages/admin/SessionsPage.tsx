import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { EmptyState, PageHeader, Panel } from "../../components/Panel";
import { useT } from "../../i18n";

export function SessionsPage() {
  const t = useT();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["sessions"], queryFn: api.listSessions });

  const kick = useMutation({
    mutationFn: ({ key, sid }: { key: string; sid: string }) => api.kickSession(key, sid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  return (
    <div className="kg-stack-6">
      <PageHeader
        title={t("sessions.title")}
        description={t("sessions.description")}
      />

      <Panel
        title={t("sessions.liveTitle")}
        description={isLoading ? t("common.loading") : t("sessions.liveDesc", { count: data.length })}
        flush
      >
        {data.length === 0 && !isLoading ? (
          <EmptyState title={t("sessions.noSessionsTitle")} body={t("sessions.noSessionsBody")} />
        ) : (
          <div className="kg-table-wrap">
            <table className="kg-table">
              <thead>
                <tr>
                  <th scope="col">{t("sessions.table.session")}</th>
                  <th scope="col">{t("sessions.table.license")}</th>
                  <th scope="col">{t("sessions.table.machine")}</th>
                  <th scope="col" className="kg-numeric">{t("sessions.table.lastHeartbeat")}</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.session_id as string}>
                    <td className="kg-mono">{s.session_id as string}</td>
                    <td className="kg-mono">{s.license_key as string}</td>
                    <td className="kg-mono">{s.machine_id as string}</td>
                    <td className="kg-numeric kg-mono">{s.last_heartbeat as number}</td>
                    <td>
                      <button
                        type="button"
                        className="kg-btn kg-btn-secondary"
                        disabled={kick.isPending}
                        onClick={() => kick.mutate({ key: s.license_key as string, sid: s.session_id as string })}
                      >
                        {t("common.kick")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
