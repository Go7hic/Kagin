import { Link } from "@tanstack/react-router";
import { BrandMark } from "./BrandMark";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useLocalizedPath, useT } from "../i18n";

const CONTACT_EMAIL = "hello@kagin.dev";
const X_URL = "https://x.com/Go7hic";
const GITHUB_URL = "https://github.com/Go7hic/Kagin";

export function SiteFooter() {
  const t = useT();
  const lp = useLocalizedPath();

  return (
    <footer className="kg-site-footer">
      <div className="kg-container kg-footer-grid">
        <div>
          <BrandMark to={lp("/")} />
          <p className="kg-body kg-footer-lede">{t("meta.tagline")}</p>
        </div>
        <div>
          <p className="kg-label">{t("nav.product")}</p>
          <p className="kg-body kg-footer-links">
            <Link to={lp("/")} hash="features">
              {t("nav.features")}
            </Link>
            <br />
            <Link to={lp("/pricing")}>{t("nav.pricing")}</Link>
            <br />
            <Link to={lp("/docs/quickstart")}>{t("nav.docs")}</Link>
          </p>
        </div>
        <div>
          <p className="kg-label">{t("nav.resources")}</p>
          <p className="kg-body kg-footer-links">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <br />
            <a href={X_URL} target="_blank" rel="noreferrer">
              {t("nav.xAccount")}
            </a>
            <br />
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              {t("nav.githubAccount")}
            </a>
          </p>
        </div>
        <div className="kg-footer-locale">
          <p className="kg-label">{t("locale.label")}</p>
          <LocaleSwitcher variant="list" />
        </div>
      </div>
    </footer>
  );
}
