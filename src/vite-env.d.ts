/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string | undefined;
  readonly VITE_GA4_MEASUREMENT_ID: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
