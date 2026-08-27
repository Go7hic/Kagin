import { Navigate, useParams } from "@tanstack/react-router";
import { getDocs, isDocSection } from "../../i18n/docs";
import { useLocale, useLocalizedPath } from "../../i18n";

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="kg-code-block">
      <pre>{children}</pre>
    </div>
  );
}

function ApiTable({
  title,
  rows,
  headers,
}: {
  title: string;
  rows: string[][];
  headers: [string, string, string];
}) {
  return (
    <div className="kg-docs-block">
      <h3 className="kg-heading">{title}</h3>
      <div className="kg-table-wrap">
        <table className="kg-table">
          <thead>
            <tr>
              <th scope="col">{headers[0]}</th>
              <th scope="col">{headers[1]}</th>
              <th scope="col">{headers[2]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([method, path, desc]) => (
              <tr key={`${method}-${path}`}>
                <td><span className="kg-badge">{method}</span></td>
                <td className="kg-mono">{path}</td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DocsSectionPage() {
  const locale = useLocale();
  const lp = useLocalizedPath();
  const { section } = useParams({ strict: false });

  if (!section || !isDocSection(section)) {
    return <Navigate to={lp("/docs/quickstart")} replace />;
  }

  const docs = getDocs(locale);

  if (section === "quickstart") {
    const s = docs.quickstart;
    return (
      <article className="kg-docs-article">
        <header className="kg-docs-article-head">
          <h1 className="kg-title">{s.title}</h1>
          <p className="kg-lede">{s.lede}</p>
        </header>
        <ol className="kg-docs-steps">
          {s.steps.map((step, i) => (
            <li key={step.title} className="kg-docs-step">
              <span className="kg-docs-step-num">{i + 1}</span>
              <div>
                <h2 className="kg-heading">{step.title}</h2>
                <p className="kg-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="kg-docs-callout">
          <h3 className="kg-heading">{s.verifyTitle}</h3>
          <p className="kg-body">{s.verifyBody}</p>
        </div>
      </article>
    );
  }

  if (section === "console") {
    const s = docs.console;
    return (
      <article className="kg-docs-article">
        <header className="kg-docs-article-head">
          <h1 className="kg-title">{s.title}</h1>
          <p className="kg-lede">{s.lede}</p>
        </header>
        <div className="kg-docs-cards">
          {s.items.map((item) => (
            <section key={item.title} className="kg-docs-card">
              <h2 className="kg-heading">{item.title}</h2>
              <p className="kg-body">{item.body}</p>
            </section>
          ))}
        </div>
      </article>
    );
  }

  if (section === "schemaPolicy") {
    const s = docs.schemaPolicy;
    return (
      <article className="kg-docs-article">
        <header className="kg-docs-article-head">
          <h1 className="kg-title">{s.title}</h1>
          <p className="kg-lede">{s.lede}</p>
        </header>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.whenTitle}</h3>
          <div className="kg-table-wrap">
            <table className="kg-table">
              <thead>
                <tr>
                  {s.whenHeaders.map((h) => (
                    <th key={h} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.whenRows.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.schemaTitle}</h3>
          <p className="kg-body">{s.schemaBody}</p>
          <h3 className="kg-heading" style={{ marginTop: "var(--kg-space-4)" }}>{s.schemaExampleTitle}</h3>
          <CodeBlock>{s.schemaExample}</CodeBlock>
          <ul className="kg-docs-notes">
            {s.schemaNotes.map((note) => (
              <li key={note} className="kg-body">{note}</li>
            ))}
          </ul>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.policyTitle}</h3>
          <p className="kg-body">{s.policyBody}</p>
          <h3 className="kg-heading" style={{ marginTop: "var(--kg-space-4)" }}>{s.policyExampleTitle}</h3>
          <CodeBlock>{s.policyExample}</CodeBlock>
          <h3 className="kg-heading" style={{ marginTop: "var(--kg-space-4)" }}>{s.policyFieldsTitle}</h3>
          <div className="kg-table-wrap">
            <table className="kg-table">
              <tbody>
                {s.policyFields.map(([field, desc]) => (
                  <tr key={field}>
                    <td className="kg-mono">{field}</td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="kg-docs-notes">
            {s.policyNotes.map((note) => (
              <li key={note} className="kg-body">{note}</li>
            ))}
          </ul>
        </div>
        <div className="kg-docs-callout">
          <h3 className="kg-heading">{s.vsTitle}</h3>
          <ul className="kg-docs-notes">
            {s.vsItems.map((item) => (
              <li key={item} className="kg-body">{item}</li>
            ))}
          </ul>
        </div>
      </article>
    );
  }

  if (section === "licensing") {
    const s = docs.licensing;
    return (
      <article className="kg-docs-article">
        <header className="kg-docs-article-head">
          <h1 className="kg-title">{s.title}</h1>
          <p className="kg-lede">{s.lede}</p>
        </header>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.matrixTitle}</h3>
          <div className="kg-table-wrap">
            <table className="kg-table">
              <thead>
                <tr>
                  {s.matrixHeaders.map((h) => (
                    <th key={h} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.matrixRows.map((row) => (
                  <tr key={row[0]}>
                    <td className="kg-mono">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.flowTitle}</h3>
          <div className="kg-docs-cards">
            {s.flows.map((flow) => (
              <section key={flow.title} className="kg-docs-card">
                <h2 className="kg-heading">{flow.title}</h2>
                <p className="kg-body">{flow.body}</p>
              </section>
            ))}
          </div>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.adminTitle}</h3>
          <ul className="kg-docs-notes">
            {s.adminItems.map((item) => (
              <li key={item} className="kg-body">{item}</li>
            ))}
          </ul>
        </div>
      </article>
    );
  }

  if (section === "developers") {
    const s = docs.developers;
    return (
      <article className="kg-docs-article">
        <header className="kg-docs-article-head">
          <h1 className="kg-title">{s.title}</h1>
          <p className="kg-lede">{s.lede}</p>
        </header>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.flowTitle}</h3>
          <ol className="kg-docs-steps">
            {s.flowSteps.map((step, i) => (
              <li key={step} className="kg-docs-step">
                <span className="kg-docs-step-num">{i + 1}</span>
                <p className="kg-body">{step}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.keysTitle}</h3>
          <p className="kg-body">{s.keysBody}</p>
          <ul className="kg-docs-notes">
            {s.keysNotes.map((note) => (
              <li key={note} className="kg-body">{note}</li>
            ))}
          </ul>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.webhookTitle}</h3>
          <CodeBlock>{s.webhookCode}</CodeBlock>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.manualTitle}</h3>
          <p className="kg-body">{s.manualBody}</p>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.errorsTitle}</h3>
          <div className="kg-table-wrap">
            <table className="kg-table">
              <thead>
                <tr>
                  <th scope="col">{docs.api.errorHeaders[0]}</th>
                  <th scope="col">{docs.api.errorHeaders[1]}</th>
                </tr>
              </thead>
              <tbody>
                {s.errorRows.map(([code, desc]) => (
                  <tr key={code}>
                    <td className="kg-mono">{code}</td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    );
  }

  if (section === "clientApps") {
    const s = docs.clientApps;
    return (
      <article className="kg-docs-article">
        <header className="kg-docs-article-head">
          <h1 className="kg-title">{s.title}</h1>
          <p className="kg-lede">{s.lede}</p>
        </header>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.desktopTitle}</h3>
          <ol className="kg-docs-steps">
            {s.desktopSteps.map((step, i) => (
              <li key={step} className="kg-docs-step">
                <span className="kg-docs-step-num">{i + 1}</span>
                <p className="kg-body">{step}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.activateTitle}</h3>
          <CodeBlock>{s.activateCode}</CodeBlock>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.activateErrorsTitle}</h3>
          <ul className="kg-docs-notes">
            {s.activateErrors.map((item) => (
              <li key={item} className="kg-body">{item}</li>
            ))}
          </ul>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.machineIdTitle}</h3>
          <p className="kg-body">{s.machineIdBody}</p>
        </div>
        {"rebindTitle" in s && (
          <div className="kg-docs-block">
            <h3 className="kg-heading">{s.rebindTitle}</h3>
            <p className="kg-body">{s.rebindBody}</p>
            <CodeBlock>{s.rebindCode}</CodeBlock>
          </div>
        )}
        <div className="kg-docs-callout">
          <h3 className="kg-heading">{s.noSecretTitle}</h3>
          <p className="kg-body">{s.noSecretBody}</p>
        </div>
      </article>
    );
  }

  if (section === "sdk") {
    const s = docs.sdk;
    return (
      <article className="kg-docs-article">
        <header className="kg-docs-article-head">
          <h1 className="kg-title">{s.title}</h1>
          <p className="kg-lede">{s.lede}</p>
        </header>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.install}</h3>
          <CodeBlock>{s.installCode}</CodeBlock>
        </div>
        <div className="kg-docs-block">
          <h3 className="kg-heading">{s.exampleTitle}</h3>
          <CodeBlock>{s.exampleCode}</CodeBlock>
        </div>
        <ul className="kg-docs-notes">
          {s.notes.map((note) => (
            <li key={note} className="kg-body">{note}</li>
          ))}
        </ul>
      </article>
    );
  }

  if (section === "api") {
    const s = docs.api;
    return (
      <article className="kg-docs-article">
        <header className="kg-docs-article-head">
          <h1 className="kg-title">{s.title}</h1>
          <p className="kg-lede">{s.lede}</p>
        </header>
        <ApiTable title={s.publicTitle} rows={s.publicRows} headers={s.tableHeaders} />
        <ApiTable title={s.adminTitle} rows={s.adminRows} headers={s.tableHeaders} />
        <p className="kg-body kg-docs-note">{s.authNote}</p>
      </article>
    );
  }

  const s = docs.deploy;
  return (
    <article className="kg-docs-article">
      <header className="kg-docs-article-head">
        <h1 className="kg-title">{s.title}</h1>
        <p className="kg-lede">{s.lede}</p>
      </header>
      <div className="kg-docs-block">
        <h3 className="kg-heading">{s.localTitle}</h3>
        <CodeBlock>{s.localCode}</CodeBlock>
      </div>
      <div className="kg-docs-block">
        <h3 className="kg-heading">{s.secretsTitle}</h3>
        <ul className="kg-docs-notes">
          {s.secrets.map((item) => (
            <li key={item} className="kg-body kg-mono">{item}</li>
          ))}
        </ul>
      </div>
      <div className="kg-docs-block">
        <h3 className="kg-heading">{s.buildTitle}</h3>
        <CodeBlock>{s.buildCode}</CodeBlock>
      </div>
    </article>
  );
}
