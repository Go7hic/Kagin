import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { PageHeader, Panel } from "../../components/Panel";
import { useLocale, useT } from "../../i18n";

function statusLabel(t: (key: string) => string, status: string | undefined, paid: boolean) {
  if (paid) return t("billing.statusActive");
  if (status === "canceled") return t("billing.statusCanceled");
  if (status === "past_due") return t("billing.statusPastDue");
  return t("billing.statusNone");
}

export function BillingPage() {
  const t = useT();
  const locale = useLocale();
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"checkout" | "portal" | "">("");
  const me = useQuery({ queryKey: ["auth", "me"], queryFn: api.me });
  const billing = me.data?.billing;
  const paid = Boolean(billing?.paid);

  async function subscribe() {
    setError("");
    setPending("checkout");
    try {
      const { url } = await api.createCheckout(locale);
      window.location.assign(url);
    } catch (e) {
      setError((e as Error).message);
      setPending("");
    }
  }

  async function manage() {
    setError("");
    setPending("portal");
    try {
      const { url } = await api.createBillingPortal(locale);
      window.location.assign(url);
    } catch (e) {
      setError((e as Error).message);
      setPending("");
    }
  }

  return (
    <div className="kg-stack-6">
      <PageHeader title={t("billing.title")} description={t("billing.description")} />

      <Panel title={t("billing.planTitle")}>
        <dl className="kg-billing-dl">
          <div>
            <dt className="kg-label">{t("billing.plan")}</dt>
            <dd className="kg-heading">{t("billing.planName")}</dd>
          </div>
          <div>
            <dt className="kg-label">{t("billing.price")}</dt>
            <dd className="kg-heading">{t("billing.priceValue")}</dd>
          </div>
          <div>
            <dt className="kg-label">{t("billing.status")}</dt>
            <dd className="kg-heading">{statusLabel(t, billing?.status, paid)}</dd>
          </div>
          <div>
            <dt className="kg-label">{t("billing.products")}</dt>
            <dd className="kg-heading">
              {t("billing.productsValue", {
                count: billing?.product_count ?? 0,
                limit: billing?.product_limit ?? 5,
              })}
            </dd>
          </div>
        </dl>

        <div className="kg-form-actions" style={{ marginTop: "var(--kg-space-6)" }}>
          {paid ? (
            <button
              type="button"
              className="kg-btn kg-btn-secondary"
              disabled={pending !== ""}
              onClick={() => manage()}
            >
              {pending === "portal" ? t("common.loading") : t("billing.manage")}
            </button>
          ) : (
            <button
              type="button"
              className="kg-btn kg-btn-primary"
              disabled={pending !== ""}
              onClick={() => subscribe()}
            >
              {pending === "checkout" ? t("common.loading") : t("pricing.subscribe")}
            </button>
          )}
          <button
            type="button"
            className="kg-btn kg-btn-ghost"
            onClick={() => qc.invalidateQueries({ queryKey: ["auth", "me"] })}
          >
            {t("billing.refresh")}
          </button>
        </div>

        {error ? (
          <p className="kg-body" style={{ color: "var(--kg-danger)", marginTop: "var(--kg-space-3)" }}>
            {t(`pricing.errors.${error}`) === `pricing.errors.${error}` ? error : t(`pricing.errors.${error}`)}
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
