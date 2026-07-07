/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXECUTIVE_COMMAND_CENTER_WORKSPACE_ID?: string;
  readonly VITE_EXECUTIVE_COMMAND_CENTER_DATASET_ID?: string;
  readonly VITE_EXECUTIVE_COMMAND_CENTER_DATASET_NAME?: string;
  readonly VITE_POWERBI_API_BASE_URL?: string;
  readonly VITE_POWERBI_BEARER_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
