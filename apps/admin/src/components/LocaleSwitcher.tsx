import { localeLabels, locales } from "../i18n";
import { useCurrentLocale, useSwitchLocale } from "../i18n/useSwitchLocale";

type Props = {
  className?: string;
  variant?: "segmented" | "list";
};

export function LocaleSwitcher({ className, variant = "segmented" }: Props) {
  const current = useCurrentLocale();
  const switchLocale = useSwitchLocale();
  const rootClass =
    variant === "list"
      ? `kg-locale-list${className ? ` ${className}` : ""}`
      : `kg-locale-switcher${className ? ` ${className}` : ""}`;

  return (
    <div className={rootClass} role="group" aria-label="Language">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          className={variant === "list" ? "kg-locale-list-btn" : "kg-locale-btn"}
          data-active={locale === current}
          aria-current={locale === current ? "true" : undefined}
          onClick={() => switchLocale(locale)}
        >
          {localeLabels[locale]}
        </button>
      ))}
    </div>
  );
}
