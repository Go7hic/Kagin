/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_LEGACY_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
