import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { EmptyState, PageHeader, Panel } from "../../components/Panel";
import { useT } from "../../i18n";
import { LicenseDevicesPanel } from "./LicenseDevicesPanel";

const LICENSE_TYPES = ["perpetual", "subscription", "floating"] as const;

function licenseTypeKey(type: string): `licenses.types.${typeof LICENSE_TYPES[number]}` | string {
  if (type === "perpetual" || type === "subscription" || type === "floating") {
    return `licenses.types.${type}`;
  }
  return type;
}

function licenseTypeHintKey(type: string): `licenses.typeHints.${typeof LICENSE_TYPES[number]}` | string {
  if (type === "perpetual" || type === "subscription" || type === "floating") {
    return `licenses.typeHints.${type}`;
  }
  return "";
}

export function LicensesPage() {
  const t = useT();
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: api.listProducts });
  const { data = [], isLoading } = useQuery({ queryKey: ["licenses"], queryFn: () => api.listLicenses() });
  const [form, setForm] = useState({
    product_id: "",
    type: "perpetual",
    expires_at: String(Math.floor(Date.now() / 1000) + 86400 * 365),
    seat_limit: "0",
    machine_limit: "1",
    customer_identity: "",
  });
  const [csv, setCsv] = useState("product_id,type,expires_at,seat_limit,machine_limit,customer_identity\n");
  const [devicesKey, setDevicesKey] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.createLicense({
        product_id: form.product_id,
        type: form.type,
        expires_at: parseInt(form.expires_at),
        seat_limit: parseInt(form.seat_limit),
        machine_limit: parseInt(form.machine_limit),
        customer_identity: form.customer_identity.trim() || undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenses"] }),
  });

  const bulk = useMutation({
    mutationFn: () => api.bulkLicenses(csv),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenses"] }),
  });

  const revoke = useMutation({
    mutationFn: (key: string) => api.revokeLicense(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenses"] }),
  });

  return (
    <div className="kg-stack-6">
      <PageHeader
        title={t("licenses.title")}
        description={t("licenses.description")}
      />

      <Panel title={t("licenses.issueTitle")}>
        <div className="kg-form-row kg-form-row-top">
          <div className="kg-field">
            <label className="kg-label">{t("licenses.product")}</label>
            <select
              className="kg-select"
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            >
              <option value="">{t("common.select")}</option>
              {(products.data || []).map((p) => (
                <option key={p.product_id as string} value={p.product_id as string}>
                  {p.product_id as string}
                </option>
              ))}
            </select>
            <p className="kg-field-hint">{t("licenses.productHint")}</p>
          </div>
          <div className="kg-field">
            <label className="kg-label">{t("licenses.type")}</label>
            <select className="kg-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {LICENSE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(licenseTypeKey(type))}
                </option>
              ))}
            </select>
            <p className="kg-field-hint">{t(licenseTypeHintKey(form.type))}</p>
          </div>
          <div className="kg-field kg-field-narrow">
            <label className="kg-label">{t("licenses.seatLimit")}</label>
            <input
              className="kg-input"
              value={form.seat_limit}
              onChange={(e) => setForm({ ...form, seat_limit: e.target.value })}
            />
            <p className="kg-field-hint">{t("licenses.seatLimitHint")}</p>
          </div>
          <div className="kg-field kg-field-narrow">
            <label className="kg-label">{t("licenses.machineLimit")}</label>
            <input
              className="kg-input"
              value={form.machine_limit}
              onChange={(e) => setForm({ ...form, machine_limit: e.target.value })}
            />
            <p className="kg-field-hint">{t("licenses.machineLimitHint")}</p>
          </div>
          <div className="kg-field kg-field-action">
            <span className="kg-label kg-label-spacer" aria-hidden="true">
              {t("licenses.createButton")}
            </span>
            <button
              type="button"
              className="kg-btn kg-btn-primary"
              disabled={!form.product_id || create.isPending}
              onClick={() => create.mutate()}
            >
              {t("licenses.createButton")}
            </button>
          </div>
        </div>
        <div className="kg-form-row kg-form-row-top" style={{ marginTop: "var(--kg-space-4)" }}>
          <div className="kg-field">
            <label className="kg-label">{t("licenses.customerIdentity")}</label>
            <input
              className="kg-input"
              type="text"
              value={form.customer_identity}
              onChange={(e) => setForm({ ...form, customer_identity: e.target.value })}
              placeholder={t("licenses.customerIdentityPlaceholder")}
            />
            <p className="kg-field-hint">{t("licenses.customerIdentityHint")}</p>
          </div>
        </div>
      </Panel>

      <Panel title={t("licenses.bulkTitle")} description={t("licenses.bulkDesc")}>
        <textarea className="kg-textarea" rows={4} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <div className="kg-form-actions">
          <button
            type="button"
            className="kg-btn kg-btn-secondary"
            disabled={bulk.isPending}
            onClick={() => bulk.mutate()}
          >
            {t("licenses.importCsv")}
          </button>
        </div>
      </Panel>

      <Panel
        title={t("licenses.allTitle")}
        description={isLoading ? t("common.loading") : t("licenses.allDesc", { count: data.length })}
        flush
      >
        {data.length === 0 && !isLoading ? (
          <EmptyState title={t("licenses.noLicensesTitle")} body={t("licenses.noLicensesBody")} />
        ) : (
          <div className="kg-table-wrap">
            <table className="kg-table">
              <thead>
                <tr>
                  <th scope="col">{t("licenses.table.key")}</th>
                  <th scope="col">{t("licenses.table.product")}</th>
                  <th scope="col">{t("licenses.table.type")}</th>
                  <th scope="col">{t("licenses.table.account")}</th>
                  <th scope="col">{t("licenses.table.status")}</th>
                  <th scope="col" className="kg-numeric">{t("licenses.table.seats")}</th>
                  <th scope="col" className="kg-numeric">{t("licenses.table.devices")}</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((l) => (
                  <tr key={l.license_key as string}>
                    <td className="kg-mono">{l.license_key as string}</td>
                    <td>{l.product_id as string}</td>
                    <td>{t(licenseTypeKey(l.type as string))}</td>
                    <td className="kg-mono">{(l.customer_identity as string) || t("common.dash")}</td>
                    <td>
                      <span className={l.status === "active" ? "kg-badge kg-badge-ok" : "kg-badge kg-badge-warn"}>
                        {l.status as string}
                      </span>
                    </td>
                    <td className="kg-numeric">{l.seat_limit as number}</td>
                    <td className="kg-numeric">{l.machine_limit as number}</td>
                    <td>
                      <div className="kg-row-actions">
                        {(l.machine_limit as number) > 0 && (
                          <button
                            type="button"
                            className="kg-btn kg-btn-secondary"
                            onClick={() =>
                              setDevicesKey(
                                devicesKey === (l.license_key as string) ? null : (l.license_key as string),
                              )
                            }
                          >
                            {t("licenses.viewDevices")}
                          </button>
                        )}
                        {l.status === "active" && (
                          <button
                            type="button"
                            className="kg-btn kg-btn-ghost"
                            disabled={revoke.isPending}
                            onClick={() => revoke.mutate(l.license_key as string)}
                          >
                            {t("common.revoke")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {devicesKey && (
        <Panel title={t("licenses.devicesPanelTitle")} flush>
          <LicenseDevicesPanel
            licenseKey={devicesKey}
            deviceLimit={
              (data.find((l) => l.license_key === devicesKey)?.machine_limit as number) || 0
            }
            onClose={() => setDevicesKey(null)}
          />
        </Panel>
      )}
    </div>
  );
}
