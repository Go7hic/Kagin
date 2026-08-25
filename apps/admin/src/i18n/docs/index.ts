import type { Locale } from "../types";
import { enDocs, type DocsContent } from "./en";
import { jaDocs } from "./ja";
import { zhDocs } from "./zh";

const catalogs: Record<Locale, DocsContent> = {
  en: enDocs,
  zh: zhDocs,
  ja: jaDocs,
};

export function getDocs(locale: Locale): DocsContent {
  return catalogs[locale] ?? enDocs;
}

export const docSections = [
  "quickstart",
  "console",
  "schemaPolicy",
  "licensing",
  "developers",
  "clientApps",
  "sdk",
  "api",
  "deploy",
] as const;

export type DocSection = (typeof docSections)[number];

export function isDocSection(value: string): value is DocSection {
  return (docSections as readonly string[]).includes(value);
}
