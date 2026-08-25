import { Link } from "@tanstack/react-router";
import { useLocalizedPath } from "../i18n";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="kg-page-header">
      <div>
        <h1 className="kg-title">{title}</h1>
        {description && <p className="kg-lede">{description}</p>}
      </div>
      {actions && <div className="kg-page-actions">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  footer,
  flush,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  /** Skip inner body padding (e.g. action lists edge-to-edge) */
  flush?: boolean;
}) {
  return (
    <section className={`kg-panel ${className ?? ""}`}>
      {(title || description) && (
        <div className="kg-panel-head">
          {title && <h2 className="kg-heading">{title}</h2>}
          {description && <p className="kg-body">{description}</p>}
        </div>
      )}
      {flush ? children : <div className="kg-panel-body">{children}</div>}
      {footer && <div className="kg-panel-foot">{footer}</div>}
    </section>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="kg-empty">
      <p className="kg-heading">{title}</p>
      <p className="kg-body">{body}</p>
    </div>
  );
}

export function ActionList({ items }: { items: { to: string; label: string }[] }) {
  const lp = useLocalizedPath();
  return (
    <ul className="kg-action-list">
      {items.map((item) => (
        <li key={item.to} className="kg-action-item">
          <Link to={lp(item.to)} className="kg-action-link">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
