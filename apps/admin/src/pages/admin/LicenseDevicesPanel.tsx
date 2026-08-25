import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { EmptyState } from "../../components/Panel";
import { useT } from "../../i18n";

type Props = {
  licenseKey: string;
  deviceLimit: number;
  onClose: () => void;
};

export function LicenseDevicesPanel({ licenseKey, deviceLimit, onClose }: Props) {
  const t = useT();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["activations", licenseKey],
    queryFn: () => api.listActivations(licenseKey),
  });

  const unbind = useMutation({
    mutationFn: (machineId: string) => api.deleteActivation(licenseKey, machineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activations", licenseKey] }),
  });

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
      {data.length === 0 && !isLoading ? (
        <EmptyState title={t("licenses.noDevicesTitle")} body={t("licenses.noDevicesBody")} />
      ) : (
        <div className="kg-table-wrap">
          <table className="kg-table">
            <thead>
              <tr>
                <th scope="col">{t("licenses.devicesTable.machine")}</th>
                <th scope="col" className="kg-numeric">{t("licenses.devicesTable.activated")}</th>
                <th scope="col" className="kg-numeric">{t("licenses.devicesTable.lastSeen")}</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const machineId = row.machine_id as string;
                return (
                  <tr key={machineId}>
                    <td className="kg-mono">{machineId}</td>
                    <td className="kg-numeric kg-mono">{row.activated_at as number}</td>
                    <td className="kg-numeric kg-mono">{row.last_seen_at as number}</td>
                    <td>
                      <button
                        type="button"
                        className="kg-btn kg-btn-secondary"
                        disabled={unbind.isPending}
                        onClick={() => unbind.mutate(machineId)}
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
