import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { api, setToken } from "../../api";
import { BrandMark } from "../../components/BrandMark";
import { ConsolePreview } from "../../components/ConsolePreview";
import { IconCheck } from "../../components/Icons";
import { useLocalizedPath, useMessages, useT } from "../../i18n";
import { safeNextPath } from "../../lib/nextPath";

const showLegacyToken = import.meta.env.VITE_SHOW_LEGACY_TOKEN === "true";

export function LoginPage() {
  const t = useT();
  const messages = useMessages();
  const lp = useLocalizedPath();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [jwt, setJwt] = useState("");
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { next?: string };

  function goAfterAuth() {
    navigate({ to: lp(safeNextPath(search.next) ?? "/admin") });
  }

  async function submitEmail() {
    setError("");
    setLoading(true);
    try {
      const res = mode === "signup"
        ? await api.signup(email, password, orgName)
        : await api.login(email, password);
      setToken(res.token);
      goAfterAuth();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const checklist = showLegacyToken ? messages.login.checklistLegacy : messages.login.checklistSaas;

  return (
    <div className="kg-login-split">
      <aside className="kg-login-brand kg-grid-bg">
        <div>
          <BrandMark to={lp("/")} />
          <h1 className="kg-title" style={{ marginTop: "var(--kg-space-8)" }}>
            {t("login.title")}
          </h1>
          <p className="kg-lede" style={{ marginTop: "var(--kg-space-4)" }}>
            {showLegacyToken ? t("login.ledeLegacy") : t("login.ledeSaas")}
          </p>
          <ul className="kg-checklist" style={{ marginTop: "var(--kg-space-6)" }}>
            {checklist.map((item) => (
              <li key={item} className="kg-check-item">
                <IconCheck />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <ConsolePreview />
      </aside>
      <div className="kg-login-form-wrap">
        <div className="kg-login-card" style={{ width: "100%", maxWidth: "28rem" }}>
          {!showLegacyToken && (
            <>
              <div className="kg-stack-row" style={{ marginBottom: "var(--kg-space-4)" }}>
                <button
                  type="button"
                  className={mode === "login" ? "kg-btn kg-btn-primary" : "kg-btn kg-btn-ghost"}
                  onClick={() => setMode("login")}
                >
                  {t("common.signIn")}
                </button>
                <button
                  type="button"
                  className={mode === "signup" ? "kg-btn kg-btn-primary" : "kg-btn kg-btn-ghost"}
                  onClick={() => setMode("signup")}
                >
                  {t("login.createWorkspace")}
                </button>
              </div>

              <div className="kg-field">
                <label className="kg-label" htmlFor="email">{t("login.email")}</label>
                <input
                  id="email"
                  type="email"
                  className="kg-input"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="kg-field" style={{ marginTop: "var(--kg-space-4)" }}>
                <label className="kg-label" htmlFor="password">{t("login.password")}</label>
                <input
                  id="password"
                  type="password"
                  className="kg-input"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {mode === "signup" && (
                <div className="kg-field" style={{ marginTop: "var(--kg-space-4)" }}>
                  <label className="kg-label" htmlFor="org">{t("login.workspaceName")}</label>
                  <input
                    id="org"
                    className="kg-input"
                    placeholder={t("login.workspacePlaceholder")}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
              )}
              {error && (
                <p className="kg-body" style={{ color: "var(--kg-danger)", marginTop: "var(--kg-space-3)" }}>
                  {error}
                </p>
              )}
              <button
                type="button"
                className="kg-btn kg-btn-primary"
                style={{ width: "100%", marginTop: "var(--kg-space-4)" }}
                disabled={loading || !email || !password || (mode === "signup" && !orgName)}
                onClick={() => submitEmail()}
              >
                {loading ? "…" : mode === "signup" ? t("login.createWorkspace") : t("common.signIn")}
              </button>
            </>
          )}

          {showLegacyToken && (
            <>
              <h2 className="kg-heading">{t("login.legacyTitle")}</h2>
              <p className="kg-body" style={{ marginTop: "var(--kg-space-2)" }}>
                {t("login.legacyLede")}
              </p>
              <textarea
                className="kg-textarea"
                rows={5}
                value={jwt}
                onChange={(e) => setJwt(e.target.value)}
                placeholder={t("login.legacyPlaceholder")}
                style={{ marginTop: "var(--kg-space-4)" }}
              />
              <button
                type="button"
                className="kg-btn kg-btn-primary"
                style={{ width: "100%", marginTop: "var(--kg-space-4)" }}
                onClick={() => {
                  setToken(jwt.trim());
                  goAfterAuth();
                }}
              >
                {t("login.continueWithToken")}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
