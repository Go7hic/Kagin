import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { Modal } from "../../components/Modal";
import { EmptyState, PageHeader, Panel } from "../../components/Panel";
import { useT } from "../../i18n";
import { LicenseDevicesPanel } from "./LicenseDevicesPanel";

const LICENSE_TYPES = ["perpetual", "subscription", "floating"] as const;
const CSV_TEMPLATE = "product_id,type,expires_at,seat_limit,machine_limit,customer_identity\n";

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

const emptyForm = () => ({
  product_id: "",
  type: "perpetual",
  expires_at: String(Math.floor(Date.now() / 1000) + 86400 * 365),
  seat_limit: "0",
  machine_limit: "1",
  customer_identity: "",
});

export function LicensesPage() {
  const t = useT();
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: api.listProducts });
  const { data = [], isLoading } = useQuery({ queryKey: ["licenses"], queryFn: () => api.listLicenses() });
  const [form, setForm] = useState(emptyForm);
  const [csv, setCsv] = useState(CSV_TEMPLATE);
  const [issueOpen, setIssueOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [devicesKey, setDevicesKey] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [bulkError, setBulkError] = useState("");

  const create = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        product_id: form.product_id,
        type: form.type,
        seat_limit: parseInt(form.seat_limit, 10) || 0,
        machine_limit: parseInt(form.machine_limit, 10) || 0,
        customer_identity: form.customer_identity.trim() || undefined,
      };
      if (form.type !== "perpetual") {
        body.expires_at = parseInt(form.expires_at, 10);
      }
      return api.createLicense(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["licenses"] });
      setForm(emptyForm());
      setFormError("");
      setIssueOpen(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const bulk = useMutation({
    mutationFn: () => api.bulkLicenses(csv),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["licenses"] });
      setCsv(CSV_TEMPLATE);
      setBulkError("");
      setBulkOpen(false);
    },
    onError: (err: Error) => setBulkError(err.message),
  });

  const revoke = useMutation({
    mutationFn: (key: string) => api.revokeLicense(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenses"] }),
  });

  const needsExpiry = form.type === "subscription" || form.type === "floating";

  return (
    <div className="kg-stack-6">
      <PageHeader
        title={t("licenses.title")}
        description={t("licenses.description")}
        actions={
          <>
            <button type="button" className="kg-btn kg-btn-primary" onClick={() => setIssueOpen(true)}>
              {t("licenses.issueTitle")}
            </button>
            <button type="button" className="kg-btn kg-btn-secondary" onClick={() => setBulkOpen(true)}>
              {t("licenses.importCsv")}
            </button>
          </>
        }
      />

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
                            onClick={() => setDevicesKey(l.license_key as string)}
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

      <Modal
        open={issueOpen}
        title={t("licenses.issueTitle")}
        onClose={() => {
          setIssueOpen(false);
          setFormError("");
        }}
        wide
        footer={
          <div className="kg-form-actions">
            <button
              type="button"
              className="kg-btn kg-btn-ghost"
              onClick={() => {
                setIssueOpen(false);
                setFormError("");
              }}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="kg-btn kg-btn-primary"
              disabled={!form.product_id || create.isPending}
              onClick={() => create.mutate()}
            >
              {t("licenses.createButton")}
            </button>
          </div>
        }
      >
        <div className="kg-form-grid">
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
          {needsExpiry ? (
            <div className="kg-field">
              <label className="kg-label">{t("licenses.expiresAt")}</label>
              <input
                className="kg-input kg-mono"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
              <p className="kg-field-hint">{t("licenses.expiresAtHint")}</p>
            </div>
          ) : null}
          <div className="kg-field">
            <label className="kg-label">{t("licenses.seatLimit")}</label>
            <input
              className="kg-input"
              value={form.seat_limit}
              onChange={(e) => setForm({ ...form, seat_limit: e.target.value })}
            />
            <p className="kg-field-hint">{t("licenses.seatLimitHint")}</p>
          </div>
          <div className="kg-field">
            <label className="kg-label">{t("licenses.machineLimit")}</label>
            <input
              className="kg-input"
              value={form.machine_limit}
              onChange={(e) => setForm({ ...form, machine_limit: e.target.value })}
            />
            <p className="kg-field-hint">{t("licenses.machineLimitHint")}</p>
          </div>
          <div className="kg-field kg-field-span">
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
        {formError ? <p className="kg-form-error" role="alert">{formError}</p> : null}
      </Modal>

      <Modal
        open={bulkOpen}
        title={t("licenses.bulkTitle")}
        description={t("licenses.bulkDesc")}
        onClose={() => {
          setBulkOpen(false);
          setBulkError("");
        }}
        footer={
          <div className="kg-form-actions">
            <button
              type="button"
              className="kg-btn kg-btn-ghost"
              onClick={() => {
                setBulkOpen(false);
                setBulkError("");
              }}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="kg-btn kg-btn-primary"
              disabled={bulk.isPending}
              onClick={() => bulk.mutate()}
            >
              {t("licenses.importCsv")}
            </button>
          </div>
        }
      >
        <textarea className="kg-textarea" rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} />
        {bulkError ? <p className="kg-form-error" role="alert">{bulkError}</p> : null}
      </Modal>

      <Modal
        open={Boolean(devicesKey)}
        title={t("licenses.devicesPanelTitle")}
        onClose={() => setDevicesKey(null)}
        wide
      >
        {devicesKey ? (
          <LicenseDevicesPanel
            licenseKey={devicesKey}
            deviceLimit={
              (data.find((l) => l.license_key === devicesKey)?.machine_limit as number) || 0
            }
            onClose={() => setDevicesKey(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
