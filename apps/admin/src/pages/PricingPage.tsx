import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, getToken } from "../api";
import { SiteNav } from "../components/SiteNav";
import { BrandMark } from "../components/BrandMark";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { useLocale, useLocalizedPath, useMessages, useT } from "../i18n";

export function PricingPage() {
  const t = useT();
  const lp = useLocalizedPath();
  const locale = useLocale();
  const messages = useMessages();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta });
  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    enabled: Boolean(getToken()),
    retry: false,
  });

  const subscribed = Boolean(me.data?.billing?.configured && me.data.billing.paid);
  const contactEmail = meta.data?.contact_email || "";

  async function subscribe() {
    setError("");
    if (!getToken()) {
      navigate({ to: lp("/admin/login"), search: { next: "/pricing" } });
      return;
    }
    if (me.isLoading) return;
    if (subscribed) {
      navigate({ to: lp("/admin/billing") });
      return;
    }
    setPending(true);
    try {
      const { url } = await api.createCheckout(locale);
      window.location.assign(url);
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="kg-shell">
      <SiteNav />
      <main>
        <div className="kg-container kg-pricing">
          <h1 className="kg-title">{t("pricing.title")}</h1>
          <p className="kg-lede kg-section-lede">{t("pricing.lede")}</p>

          <div className="kg-pricing-grid">
            <article className="kg-pricing-card kg-pricing-card--featured">
              <p className="kg-label">{t("pricing.hostedLabel")}</p>
              <h2 className="kg-display kg-pricing-price">
                {t("pricing.hostedPrice")}
                <span className="kg-pricing-period">{t("pricing.hostedPeriod")}</span>
              </h2>
              <ul className="kg-pricing-points">
                {messages.pricing.hostedPoints.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <button
                type="button"
                className="kg-btn kg-btn-primary"
                disabled={pending || (Boolean(getToken()) && me.isLoading)}
                onClick={() => subscribe()}
              >
                {pending ? t("common.loading") : t("pricing.subscribe")}
              </button>
            </article>

            <article className="kg-pricing-card">
              <p className="kg-label">{t("pricing.selfHostLabel")}</p>
              <h2 className="kg-heading">{t("pricing.selfHostTitle")}</h2>
              <p className="kg-body">{t("pricing.selfHostLede")}</p>
              <ul className="kg-pricing-points">
                {messages.pricing.selfHostPoints.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {contactEmail ? (
                <a className="kg-btn kg-btn-secondary" href={`mailto:${contactEmail}`}>
                  {t("pricing.contact")}
                </a>
              ) : null}
            </article>
          </div>

          {error ? (
            <p className="kg-body kg-pricing-error">
              {t(`pricing.errors.${error}`) === `pricing.errors.${error}` ? error : t(`pricing.errors.${error}`)}
            </p>
          ) : null}

          <footer className="kg-footer-grid kg-landing-footer">
            <div>
              <BrandMark />
              <p className="kg-body kg-footer-lede">{t("meta.tagline")}</p>
            </div>
            <div>
              <p className="kg-label">{t("nav.product")}</p>
              <p className="kg-body kg-footer-links">
                <Link to={lp("/")}>{t("nav.features")}</Link>
                <br />
                <Link to={lp("/pricing")}>{t("nav.pricing")}</Link>
                <br />
                <Link to={lp("/docs/quickstart")}>{t("nav.docs")}</Link>
              </p>
            </div>
            <div className="kg-footer-locale">
              <p className="kg-label">{t("locale.label")}</p>
              <LocaleSwitcher variant="list" />
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
