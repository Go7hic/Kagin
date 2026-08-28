import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export function Modal({ open, title, description, onClose, children, footer, wide }: Props) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="kg-modal-root" role="presentation">
      <button type="button" className="kg-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        ref={panelRef}
        className={`kg-modal${wide ? " kg-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <div className="kg-modal-head">
          <div>
            <h2 id={titleId} className="kg-heading">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="kg-body">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="kg-btn kg-btn-ghost" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="kg-modal-body">{children}</div>
        {footer ? <div className="kg-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
