/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
interface ImportMetaEnv {
  readonly CARE_CDN_URL?: string;

  readonly REACT_APP_TITLE: string;
  readonly REACT_APP_META_DESCRIPTION: string;
  readonly REACT_APP_COVER_IMAGE: string;
  readonly REACT_APP_COVER_IMAGE_ALT: string;
  readonly REACT_PUBLIC_URL: string;
  readonly REACT_CARE_API_URL: string;
  readonly REACT_DASHBOARD_URL?: string;
  readonly REACT_GITHUB_URL?: string;
  readonly REACT_OHCN_URL?: string;
  readonly REACT_HEADER_LOGO?: string;
  readonly REACT_MAIN_LOGO?: string;
  readonly REACT_STATE_LOGO?: string;
  readonly REACT_CUSTOM_LOGO?: string;
  readonly REACT_CUSTOM_LOGO_ALT?: string;
  readonly REACT_CUSTOM_DESCRIPTION?: string;
  readonly REACT_RECAPTCHA_SITE_KEY?: string;
  readonly REACT_JWT_TOKEN_REFRESH_INTERVAL?: string;
  readonly REACT_MIN_ENCOUNTER_DATE?: string;
  readonly REACT_DEFAULT_ENCOUNTER_TYPE?: string;
  readonly REACT_ALLOWED_ENCOUNTER_CLASSES?: string;
  readonly REACT_ALLOWED_LOCALES?: string;
  readonly REACT_ENABLED_APPS?: string;
  readonly REACT_APP_MAX_IMAGE_UPLOAD_SIZE_MB?: string;
  readonly REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION?: string;

  // Plugins related envs...
  readonly REACT_SENTRY_DSN?: string;
  readonly REACT_SENTRY_ENVIRONMENT?: string;
  readonly REACT_DEFAULT_COUNTRY?: string;
  readonly REACT_MAPS_FALLBACK_URL_TEMPLATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
