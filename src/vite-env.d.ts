/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  /** 다른 origin일 때만. 없으면 same-origin (`/v1`, Vite 프록시). */
  readonly VITE_API_BASE_URL?: string
  /** `true`면 Nest 대신 mock. 기본은 Nest. */
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
