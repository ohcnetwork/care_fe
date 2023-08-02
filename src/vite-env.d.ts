/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
interface ImportMetaEnv {
  readonly REACT_APP_TITLE: string;
  readonly REACT_APP_META_DESCRIPTION: string;
  readonly REACT_APP_COVER_IMAGE: string;
  readonly REACT_APP_COVER_IMAGE_ALT: string;
  readonly REACT_APP_CONFIG: string;
  readonly REACT_PUBLIC_URL: string;
  readonly REACT_APP_SITE_URL: string;
  readonly REACT_APP_ANALYTICS_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
