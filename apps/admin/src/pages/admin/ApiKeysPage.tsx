import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { EmptyState, PageHeader, Panel } from "../../components/Panel";
import { useT } from "../../i18n";

export function ApiKeysPage() {
  const t = useT();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["api-keys"], queryFn: api.listApiKeys });
  const [name, setName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const exampleCode = t("apiKeys.exampleCode").replace(
    "{base}",
    typeof window !== "undefined" ? window.location.origin : "https://api.example.com",
  );

  const create = useMutation({
    mutationFn: () => api.createApiKey(name.trim()),
    onSuccess: (res) => {
      setRevealedKey(res.api_key);
      setName("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const revoke = useMutation({
    mutationFn: (keyId: string) => api.revokeApiKey(keyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(exampleCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="kg-stack-6">
      <PageHeader title={t("apiKeys.title")} description={t("apiKeys.description")} />

      <Panel title={t("apiKeys.createTitle")} description={t("apiKeys.createDesc")}>
        <div className="kg-form-row kg-form-row-top">
          <div className="kg-field">
            <label className="kg-label">{t("apiKeys.nameLabel")}</label>
            <input
              className="kg-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("apiKeys.namePlaceholder")}
            />
            <p className="kg-field-hint">{t("apiKeys.nameHint")}</p>
          </div>
          <div className="kg-field kg-field-action">
            <span className="kg-label kg-label-spacer" aria-hidden="true">{t("apiKeys.createButton")}</span>
            <button
              type="button"
              className="kg-btn kg-btn-primary"
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {t("apiKeys.createButton")}
            </button>
          </div>
        </div>
      </Panel>

      {revealedKey && (
        <Panel title={t("apiKeys.revealTitle")} description={t("apiKeys.revealDesc")}>
          <div className="kg-code-block">
            <pre className="kg-mono">{revealedKey}</pre>
          </div>
          <div className="kg-form-actions">
            <button type="button" className="kg-btn kg-btn-secondary" onClick={() => setRevealedKey(null)}>
              {t("apiKeys.dismissReveal")}
            </button>
          </div>
        </Panel>
      )}

      <Panel title={t("apiKeys.exampleTitle")} description={t("apiKeys.exampleDesc")}>
        <div className="kg-code-block">
          <pre>{exampleCode}</pre>
        </div>
        <div className="kg-form-actions">
          <button type="button" className="kg-btn kg-btn-secondary" onClick={() => void copyExample()}>
            {copied ? t("apiKeys.copied") : t("apiKeys.copyExample")}
          </button>
        </div>
      </Panel>

      <Panel
        title={t("apiKeys.listTitle")}
        description={isLoading ? t("common.loading") : t("apiKeys.listDesc", { count: data.length })}
        flush
      >
        {data.length === 0 && !isLoading ? (
          <EmptyState title={t("apiKeys.noKeysTitle")} body={t("apiKeys.noKeysBody")} />
        ) : (
          <div className="kg-table-wrap">
            <table className="kg-table">
              <thead>
                <tr>
                  <th scope="col">{t("apiKeys.table.name")}</th>
                  <th scope="col">{t("apiKeys.table.prefix")}</th>
                  <th scope="col" className="kg-numeric">{t("apiKeys.table.created")}</th>
                  <th scope="col" className="kg-numeric">{t("apiKeys.table.lastUsed")}</th>
                  <th scope="col">{t("apiKeys.table.status")}</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const revoked = (row.revoked_at as number) > 0;
                  return (
                    <tr key={row.key_id as string}>
                      <td>{row.name as string}</td>
                      <td className="kg-mono">{row.prefix as string}…</td>
                      <td className="kg-numeric kg-mono">{row.created_at as number}</td>
                      <td className="kg-numeric kg-mono">
                        {(row.last_used_at as number) > 0 ? (row.last_used_at as number) : t("common.dash")}
                      </td>
                      <td>
                        <span className={revoked ? "kg-badge kg-badge-warn" : "kg-badge kg-badge-ok"}>
                          {revoked ? t("apiKeys.statusRevoked") : t("apiKeys.statusActive")}
                        </span>
                      </td>
                      <td>
                        {!revoked && (
                          <button
                            type="button"
                            className="kg-btn kg-btn-secondary"
                            disabled={revoke.isPending}
                            onClick={() => revoke.mutate(row.key_id as string)}
                          >
                            {t("apiKeys.revokeButton")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
