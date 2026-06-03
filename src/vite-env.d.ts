/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PISTON_URL?: string;
  readonly VITE_ENABLED_LANGUAGES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
