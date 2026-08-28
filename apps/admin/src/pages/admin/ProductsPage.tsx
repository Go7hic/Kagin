import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { Modal } from "../../components/Modal";
import { EmptyState, PageHeader, Panel } from "../../components/Panel";
import { Link } from "@tanstack/react-router";
import { useLocalizedPath, useT } from "../../i18n";

const DEFAULT_SCHEMA = `{
  "properties": {
    "tier": "string",
    "seats": "number"
  },
  "required": ["tier"]
}`;

export function ProductsPage() {
  const t = useT();
  const lp = useLocalizedPath();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: api.listProducts });
  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [schemaProductId, setSchemaProductId] = useState<string | null>(null);
  const [schemaJson, setSchemaJson] = useState(DEFAULT_SCHEMA);
  const [schemaError, setSchemaError] = useState("");

  const create = useMutation({
    mutationFn: () => api.createProduct(productId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setProductId("");
      setName("");
    },
  });

  const keypair = useMutation({
    mutationFn: (id: string) => api.generateKeypair(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const schema = useMutation({
    mutationFn: () => {
      if (!schemaProductId) throw new Error("no_product");
      const parsed = JSON.parse(schemaJson) as Record<string, unknown>;
      return api.updateFeatureSchema(schemaProductId, parsed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setSchemaError("");
      setSchemaProductId(null);
    },
    onError: (err: Error) => setSchemaError(err.message),
  });

  function openSchemaEditor(product: Record<string, unknown>) {
    const id = product.product_id as string;
    setSchemaProductId(id);
    setSchemaError("");
    const raw = product.feature_schema as string | undefined;
    if (raw) {
      try {
        setSchemaJson(JSON.stringify(JSON.parse(raw), null, 2));
      } catch {
        setSchemaJson(raw);
      }
    } else {
      setSchemaJson(DEFAULT_SCHEMA);
    }
  }

  function closeSchemaEditor() {
    setSchemaProductId(null);
    setSchemaError("");
  }

  return (
    <div className="kg-stack-6">
      <PageHeader
        title={t("products.title")}
        description={t("products.description")}
      />

      <Panel title={t("products.createTitle")}>
        <div className="kg-form-row">
          <div className="kg-field">
            <label className="kg-label" htmlFor="pid">{t("products.productId")}</label>
            <input
              id="pid"
              className="kg-input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder={t("products.productIdPlaceholder")}
            />
          </div>
          <div className="kg-field">
            <label className="kg-label" htmlFor="pname">{t("products.name")}</label>
            <input
              id="pname"
              className="kg-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("products.namePlaceholder")}
            />
          </div>
          <div className="kg-field kg-field-action">
            <span className="kg-label kg-label-spacer" aria-hidden="true">
              {t("products.createButton")}
            </span>
            <button
              type="button"
              className="kg-btn kg-btn-primary"
              disabled={!productId || create.isPending}
              onClick={() => create.mutate()}
            >
              {t("products.createButton")}
            </button>
          </div>
        </div>
        {create.isError ? (
          <p className="kg-body" style={{ color: "var(--kg-danger)", marginTop: "var(--kg-space-3)" }}>
            {t(`pricing.errors.${create.error.message}`) === `pricing.errors.${create.error.message}`
              ? create.error.message
              : t(`pricing.errors.${create.error.message}`)}
            {create.error.message === "payment_required" ? (
              <>
                {" "}
                <Link to={lp("/admin/billing")}>{t("admin.nav.billing")}</Link>
              </>
            ) : null}
          </p>
        ) : null}
      </Panel>

      <Panel
        title={t("products.catalogTitle")}
        description={isLoading ? t("common.loading") : t("products.catalogDesc", { count: data.length })}
        flush
      >
        {data.length === 0 && !isLoading ? (
          <EmptyState title={t("products.noProductsTitle")} body={t("products.noProductsBody")} />
        ) : (
          <div className="kg-table-wrap">
            <table className="kg-table">
              <thead>
                <tr>
                  <th scope="col">{t("products.table.id")}</th>
                  <th scope="col">{t("products.table.name")}</th>
                  <th scope="col">{t("products.table.keys")}</th>
                  <th scope="col">{t("products.table.schema")}</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.product_id as string}>
                    <td className="kg-mono">{p.product_id as string}</td>
                    <td>{p.name as string}</td>
                    <td>
                      {p.public_jwk ? (
                        <span className="kg-badge kg-badge-ok">{t("common.configured")}</span>
                      ) : (
                        <span className="kg-badge">{t("common.missing")}</span>
                      )}
                    </td>
                    <td>
                      {p.feature_schema && p.feature_schema !== "{}" ? (
                        <span className="kg-badge kg-badge-ok">{t("common.defined")}</span>
                      ) : (
                        <span className="kg-badge">{t("common.empty")}</span>
                      )}
                    </td>
                    <td>
                      <div className="kg-table-actions">
                        <button
                          type="button"
                          className="kg-btn kg-btn-secondary"
                          onClick={() => openSchemaEditor(p)}
                        >
                          {t("products.editSchema")}
                        </button>
                        <button
                          type="button"
                          className="kg-btn kg-btn-secondary"
                          onClick={() => keypair.mutate(p.product_id as string)}
                        >
                          {t("products.generateKeypair")}
                        </button>
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
        open={Boolean(schemaProductId)}
        title={t("products.schemaTitle", { id: schemaProductId || "" })}
        description={t("products.schemaDesc")}
        onClose={closeSchemaEditor}
        wide
        footer={
          <div className="kg-form-actions">
            <button type="button" className="kg-btn kg-btn-ghost" onClick={closeSchemaEditor}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="kg-btn kg-btn-primary"
              disabled={schema.isPending}
              onClick={() => {
                try {
                  JSON.parse(schemaJson);
                  setSchemaError("");
                  schema.mutate();
                } catch {
                  setSchemaError("invalid_json");
                }
              }}
            >
              {t("products.saveSchema")}
            </button>
          </div>
        }
      >
        <div className="kg-field">
          <label className="kg-label" htmlFor="schema-json">{t("products.schemaJson")}</label>
          <textarea
            id="schema-json"
            className="kg-textarea"
            rows={12}
            value={schemaJson}
            onChange={(e) => setSchemaJson(e.target.value)}
          />
        </div>
        {schemaError ? <p className="kg-form-error" role="alert">{schemaError}</p> : null}
      </Modal>
    </div>
  );
}
