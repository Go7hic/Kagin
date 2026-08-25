import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { EmptyState, PageHeader, Panel } from "../../components/Panel";
import { useT } from "../../i18n";

export function PoliciesPage() {
  const t = useT();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["policies"], queryFn: api.listPolicies });
  const [json, setJson] = useState('{"max_offline_days":7,"require_heartbeat":true}');

  const publish = useMutation({
    mutationFn: () => api.publishPolicy(null, JSON.parse(json)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });

  return (
    <div className="kg-stack-6">
      <PageHeader
        title={t("policies.title")}
        description={t("policies.description")}
      />

      <Panel title={t("policies.globalTitle")} description={t("policies.globalDesc")}>
        <div className="kg-field">
          <label className="kg-label" htmlFor="policy-json">{t("policies.policyJson")}</label>
          <textarea
            id="policy-json"
            className="kg-textarea"
            rows={8}
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
        </div>
        <div className="kg-form-actions">
          <button
            type="button"
            className="kg-btn kg-btn-primary"
            disabled={publish.isPending}
            onClick={() => publish.mutate()}
          >
            {t("policies.publishButton")}
          </button>
        </div>
      </Panel>

      <Panel
        title={t("policies.historyTitle")}
        description={isLoading ? t("common.loading") : t("policies.historyDesc", { count: data.length })}
        flush
      >
        {data.length === 0 && !isLoading ? (
          <EmptyState title={t("policies.noPoliciesTitle")} body={t("policies.noPoliciesBody")} />
        ) : (
          <div className="kg-table-wrap">
            <table className="kg-table">
              <thead>
                <tr>
                  <th scope="col">{t("policies.table.scope")}</th>
                  <th scope="col" className="kg-numeric">{t("policies.table.updated")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id as number}>
                    <td>{(p.product_id as string) ?? t("common.global")}</td>
                    <td className="kg-numeric kg-mono">{p.updated_at as number}</td>
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
