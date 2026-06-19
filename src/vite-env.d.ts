/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MINIMAX_API_KEY: string;
  readonly VITE_MINIMAX_BASE_URL: string;
  readonly VITE_MINIMAX_GROUP_ID: string;
  readonly VITE_VOLCANO_API_KEY: string;
  readonly VITE_VOLCANO_BASE_URL: string;
  readonly VITE_VOLCANO_ENDPOINT_ID: string;
  readonly VITE_VOLCANO_MODEL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
