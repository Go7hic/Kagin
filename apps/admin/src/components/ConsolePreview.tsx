import { useT } from "../i18n";

export function ConsolePreview({ large = false }: { large?: boolean }) {
  const t = useT();

  return (
    <div className={`kg-console${large ? " kg-console-lg" : ""}`} aria-label={t("console.ariaLabel")}>
      <div className="kg-console-bar">
        <span className="kg-console-dots">
          <i /><i /><i />
        </span>
        <span className="kg-mono kg-console-title">kagin — activate</span>
      </div>
      <div className="kg-console-body">
        <div className="kg-console-line">
          <span className="kg-console-prompt">$</span>
          <span className="kg-mono">curl -X POST /v1/activate …</span>
        </div>
        <pre className="kg-console-json">
{`{
  "ok": true,
  "state": "active",
  "machine_bound": true,
  "server_time": 1787498018,
  "signature": "iBzVkQOUErs…"
}`}
        </pre>
        <div className="kg-console-status">
          <span className="kg-status-dot" />
          {t("console.status")}
        </div>
      </div>
    </div>
  );
}
