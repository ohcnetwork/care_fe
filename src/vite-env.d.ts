/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_META_DESCRIPTION: string;
  readonly VITE_APP_COVER_IMAGE: string;
  readonly VITE_APP_COVER_IMAGE_ALT: string;
  readonly VITE_APP_CONFIG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
