import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { EmptyState } from "../../components/Panel";
import { useT } from "../../i18n";

type Props = {
  licenseKey: string;
  deviceLimit: number;
  onClose: () => void;
};

function formatEpoch(sec: number, locale: string) {
  if (!sec) return "—";
  return new Date(sec * 1000).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LicenseDevicesPanel({ licenseKey, deviceLimit, onClose }: Props) {
  const t = useT();
  const qc = useQueryClient();
  const [machineId, setMachineId] = useState("");
  const [error, setError] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["activations", licenseKey],
    queryFn: () => api.listActivations(licenseKey),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["activations", licenseKey] });
    qc.invalidateQueries({ queryKey: ["licenses"] });
  };

  const unbind = useMutation({
    mutationFn: (id: string) => api.deleteActivation(licenseKey, id),
    onSuccess: () => {
      setError("");
      refresh();
    },
    onError: (err: Error) => setError(err.message),
  });

  const bind = useMutation({
    mutationFn: (id: string) => api.createActivation(licenseKey, id),
    onSuccess: () => {
      setMachineId("");
      setError("");
      refresh();
    },
    onError: (err: Error) => setError(err.message),
  });

  const atLimit = deviceLimit > 0 && data.length >= deviceLimit;
  const locale = typeof navigator !== "undefined" ? navigator.language : "en";

  return (
    <div className="kg-license-devices">
      <div className="kg-license-devices-head">
        <div>
          <p className="kg-label">{t("licenses.devicesTitle")}</p>
          <p className="kg-body kg-mono">{licenseKey}</p>
        </div>
        <div className="kg-license-devices-meta">
          <span className="kg-body">
            {t("licenses.devicesUsage", { used: data.length, limit: deviceLimit })}
          </span>
          <button type="button" className="kg-btn kg-btn-ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </div>
      </div>

      <p className="kg-body kg-license-devices-hint">{t("licenses.devicesHint")}</p>

      <div className="kg-license-devices-bind">
        <div className="kg-field">
          <label className="kg-label" htmlFor="admin-bind-machine">
            {t("licenses.bindMachineId")}
          </label>
          <input
            id="admin-bind-machine"
            className="kg-input kg-mono"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            placeholder={t("licenses.bindMachinePlaceholder")}
            disabled={bind.isPending || atLimit}
          />
          <p className="kg-field-hint">
            {atLimit ? t("licenses.bindAtLimit") : t("licenses.bindHint")}
          </p>
        </div>
        <div className="kg-field kg-field-action">
          <span className="kg-label kg-label-spacer" aria-hidden="true">
            {t("licenses.bindButton")}
          </span>
          <button
            type="button"
            className="kg-btn kg-btn-primary"
            disabled={!machineId.trim() || bind.isPending || atLimit}
            onClick={() => bind.mutate(machineId.trim())}
          >
            {t("licenses.bindButton")}
          </button>
        </div>
      </div>

      {error ? <p className="kg-form-error" role="alert">{error}</p> : null}

      {data.length === 0 && !isLoading ? (
        <EmptyState title={t("licenses.noDevicesTitle")} body={t("licenses.noDevicesBody")} />
      ) : (
        <div className="kg-table-wrap">
          <table className="kg-table">
            <thead>
              <tr>
                <th scope="col">{t("licenses.devicesTable.machine")}</th>
                <th scope="col">{t("licenses.devicesTable.activated")}</th>
                <th scope="col">{t("licenses.devicesTable.lastSeen")}</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const id = row.machine_id as string;
                return (
                  <tr key={id}>
                    <td className="kg-mono">{id}</td>
                    <td>{formatEpoch(row.activated_at as number, locale)}</td>
                    <td>{formatEpoch(row.last_seen_at as number, locale)}</td>
                    <td>
                      <button
                        type="button"
                        className="kg-btn kg-btn-secondary"
                        disabled={unbind.isPending}
                        onClick={() => {
                          if (!window.confirm(t("licenses.unbindConfirm", { machine: id }))) return;
                          unbind.mutate(id);
                        }}
                      >
                        {t("common.unbind")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
