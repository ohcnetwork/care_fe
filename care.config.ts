export interface Logo {
  light: string;
  dark: string;
}

export interface CareConfig {
  dashboard_url?: string;
  github_url: string;
  ohcn_url: string;
  site_url: string;
  analytics_server_url: string;
  main_logo: Logo;
  state_logo?: Logo;
  custom_logo?: Logo;
  custom_logo_alt?: Logo;
  custom_description?: string;
  gmaps_api_key: string;
  gov_data_api_key: string;
  recaptcha_site_key: string;
  sentry_dsn: string;
  sentry_environment: string;
  header_logo: Logo;
  kasp_enabled: boolean;
  kasp_string: string;
  kasp_full_string: string;
  sample_format_asset_import: string;
  sample_format_external_result_import: string;
  enable_hcx: boolean;
  enable_abdm: boolean;
  enable_scribe: boolean;
  wartime_shifting: boolean;
  jwt_token_refresh_interval?: number;
  min_encounter_date: string;
}

export const careConfig: CareConfig = {
  dashboard_url: import.meta.env.REACT_DASHBOARD_URL,
  github_url:
    import.meta.env.REACT_GITHUB_URL || "https://github.com/ohcnetwork",
  ohcn_url: import.meta.env.REACT_OHCN_URL || "https://ohc.network?ref=care",
  site_url: import.meta.env.REACT_SITE_URL || "care.ohc.network",
  analytics_server_url:
    import.meta.env.REACT_ANALYTICS_SERVER_URL ||
    "https://plausible.10bedicu.in",
  header_logo: {
    light:
      import.meta.env.REACT_HEADER_LOGO_LIGHT ||
      "https://cdn.ohc.network/header_logo.png",
    dark:
      import.meta.env.REACT_HEADER_LOGO_DARK ||
      "https://cdn.ohc.network/header_logo.png",
  },
  main_logo: {
    light:
      import.meta.env.REACT_MAIN_LOGO_LIGHT ||
      "https://cdn.ohc.network/light-logo.svg",
    dark:
      import.meta.env.REACT_MAIN_LOGO_DARK ||
      "https://cdn.ohc.network/black-logo.svg",
  },
  state_logo: import.meta.env.REACT_STATE_LOGO
    ? JSON.parse(import.meta.env.REACT_STATE_LOGO)
    : undefined,
  custom_logo: import.meta.env.REACT_CUSTOM_LOGO
    ? JSON.parse(import.meta.env.REACT_CUSTOM_LOGO)
    : undefined,
  custom_logo_alt: import.meta.env.REACT_CUSTOM_LOGO_ALT
    ? JSON.parse(import.meta.env.REACT_CUSTOM_LOGO_ALT)
    : undefined,
  custom_description: import.meta.env.REACT_CUSTOM_DESCRIPTION,
  gmaps_api_key:
    import.meta.env.REACT_GMAPS_API_KEY ||
    "AIzaSyDsBAc3y7deI5ZO3NtK5GuzKwtUzQNJNUk",
  gov_data_api_key:
    import.meta.env.REACT_GOV_DATA_API_KEY ||
    "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b",
  recaptcha_site_key:
    import.meta.env.REACT_RECAPTCHA_SITE_KEY ||
    "6LdvxuQUAAAAADDWVflgBqyHGfq-xmvNJaToM0pN",
  sentry_dsn:
    import.meta.env.REACT_SENTRY_DSN ||
    "https://8801155bd0b848a09de9ebf6f387ebc8@sentry.io/5183632",
  sentry_environment: import.meta.env.REACT_SENTRY_ENVIRONMENT || "staging",
  kasp_enabled: import.meta.env.REACT_KASP_ENABLED === "true",
  kasp_string: import.meta.env.REACT_KASP_STRING || "KASP",
  kasp_full_string:
    import.meta.env.REACT_KASP_FULL_STRING ||
    "Karunya Arogya Suraksha Padhathi",
  sample_format_asset_import:
    import.meta.env.REACT_SAMPLE_FORMAT_ASSET_IMPORT ||
    "/asset-import-template.xlsx",
  sample_format_external_result_import:
    import.meta.env.REACT_SAMPLE_FORMAT_EXTERNAL_RESULT_IMPORT ||
    "/External-Results-Template.csv",
  enable_hcx: import.meta.env.REACT_ENABLE_HCX === "true",
  enable_abdm: import.meta.env.REACT_ENABLE_ABDM === "true" || true,
  enable_scribe: import.meta.env.REACT_ENABLE_SCRIBE === "true",
  wartime_shifting: import.meta.env.REACT_WARTIME_SHIFTING === "true",
  jwt_token_refresh_interval: import.meta.env.REACT_JWT_TOKEN_REFRESH_INTERVAL
    ? parseInt(import.meta.env.REACT_JWT_TOKEN_REFRESH_INTERVAL)
    : undefined,
  min_encounter_date: import.meta.env.REACT_MIN_ENCOUNTER_DATE || "2020-01-01",
};
