import { Link } from "@tanstack/react-router";
import { useLocalizedPath, useMessages, useT } from "../i18n";
import { BrandMark } from "../components/BrandMark";
import { ConsolePreview } from "../components/ConsolePreview";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { SiteNav } from "../components/SiteNav";

export function LandingPage() {
  const t = useT();
  const lp = useLocalizedPath();
  const messages = useMessages();

  return (
    <div className="kg-shell">
      <SiteNav />

      <main>
        <div className="kg-hero-region kg-grid-bg">
          <div className="kg-container">
            <section className="kg-hero-grid">
              <div className="kg-hero-copy">
                <h1 className="kg-hero-title">
                  <span className="kg-display kg-display-pixel kg-hero-brand">kagin</span>
                  <span className="kg-hero-headline">{t("landing.heroTitle")}</span>
                </h1>
                <p className="kg-lede kg-hero-lede">{t("landing.heroLede")}</p>
                <div className="kg-hero-actions">
                  <Link to={lp("/admin")} className="kg-btn kg-btn-primary">
                    {t("common.openConsole")}
                  </Link>
                  <Link to={lp("/docs/quickstart")} className="kg-btn kg-btn-secondary">
                    {t("common.readDocs")}
                  </Link>
                </div>
              </div>
              <div className="kg-hero-visual">
                <ConsolePreview large />
              </div>
            </section>
          </div>
        </div>

        <div className="kg-container">
          <section className="kg-stats-bar" aria-label="Product traits">
            {messages.landing.stats.map((s) => (
              <div key={s.label} className="kg-stats-bar-item">
                <span className="kg-label">{s.label}</span>
                <strong className="kg-pixel-stat">{s.value}</strong>
              </div>
            ))}
          </section>

          <section id="features" className="kg-section">
            <h2 className="kg-title">{t("landing.featuresTitle")}</h2>
            <p className="kg-lede kg-section-lede">{t("landing.featuresLede")}</p>
            <div className="kg-feature-list">
              {messages.landing.features.map((f) => (
                <article key={f.title} className="kg-feature-item">
                  <h3 className="kg-heading">{f.title}</h3>
                  <p className="kg-body">{f.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="flow" className="kg-section">
            <h2 className="kg-title">{t("landing.flowTitle")}</h2>
            <p className="kg-body kg-section-lede">{t("landing.flowLede")}</p>
            <div className="kg-flow">
              {messages.landing.flow.map((step) => (
                <div key={step.title} className="kg-flow-step">
                  <h3 className="kg-heading">{step.title}</h3>
                  <p className="kg-body">{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="api" className="kg-section">
            <div className="kg-dashboard-grid">
              <div>
                <h2 className="kg-title">{t("landing.apiTitle")}</h2>
                <p className="kg-body kg-section-lede">{t("landing.apiLede")}</p>
                <div className="kg-stack-row kg-api-routes">
                  <span className="kg-pill">POST /v1/activate</span>
                  <span className="kg-pill">POST /v1/heartbeat</span>
                  <span className="kg-pill">POST /v1/feature-token</span>
                </div>
                <p className="kg-body kg-api-docs-link">
                  <Link to={lp("/docs/api")}>{t("common.readDocs")} →</Link>
                </p>
              </div>
              <div className="kg-code-block">
                <div className="kg-code-block-head">{t("landing.apiExampleHead")}</div>
                <pre>
{`curl -X POST /v1/activate \\
  -H 'content-type: application/json' \\
  -d '{
    "license_key": "…",
    "machine_id": "…",
    "identity": { "email": "…" }
  }'`}
                </pre>
              </div>
            </div>
          </section>

          <section className="kg-cta-band">
            <div>
              <h2 className="kg-heading">{t("landing.ctaTitle")}</h2>
              <p className="kg-body kg-cta-lede">{t("landing.ctaLede")}</p>
            </div>
            <div className="kg-cta-actions">
              <Link to={lp("/admin")} className="kg-btn kg-btn-primary">
                {t("common.goToConsole")}
              </Link>
              <Link to={lp("/docs/quickstart")} className="kg-btn kg-btn-secondary">
                {t("common.readDocs")}
              </Link>
            </div>
          </section>

          <footer className="kg-footer-grid kg-landing-footer">
            <div>
              <BrandMark />
              <p className="kg-body kg-footer-lede">{t("meta.tagline")}</p>
            </div>
            <div>
              <p className="kg-label">{t("nav.product")}</p>
              <p className="kg-body kg-footer-links">
                <a href="#features">{t("nav.features")}</a>
                <br />
                <a href="#api">{t("nav.api")}</a>
                <br />
                <Link to={lp("/pricing")}>{t("nav.pricing")}</Link>
                <br />
                <Link to={lp("/docs/quickstart")}>{t("nav.docs")}</Link>
                <br />
                <Link to={lp("/admin")}>{t("nav.console")}</Link>
              </p>
            </div>
            <div>
              <p className="kg-label">{t("nav.deploy")}</p>
              <p className="kg-body kg-footer-lede">{t("landing.footerDeploy")}</p>
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
