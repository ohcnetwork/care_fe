const env = import.meta.env;

interface ILogo {
  light: string;
  dark: string;
}

const logo = (value?: string, fallback?: ILogo) => {
  return value ? (JSON.parse(value) as ILogo) : fallback;
};

const careConfig = {
  apiUrl: env.REACT_CARE_API_URL,

  urls: {
    dashboard: env.REACT_DASHBOARD_URL,
    github: env.REACT_GITHUB_URL || "https://github.com/ohcnetwork",
    ohcn: env.REACT_OHCN_URL || "https://ohc.network?ref=care",
  },

  headerLogo: logo(env.REACT_HEADER_LOGO, {
    light: "https://cdn.ohc.network/header_logo.png",
    dark: "https://cdn.ohc.network/header_logo.png",
  }),
  mainLogo: logo(env.REACT_MAIN_LOGO, {
    light: "https://cdn.ohc.network/light-logo.svg",
    dark: "https://cdn.ohc.network/black-logo.svg",
  }),
  stateLogo: logo(env.REACT_STATE_LOGO),
  customLogo: logo(env.REACT_CUSTOM_LOGO),
  customLogoAlt: logo(env.REACT_CUSTOM_LOGO_ALT),
  customDescription: env.REACT_CUSTOM_DESCRIPTION,

  gmapsApiKey:
    env.REACT_GMAPS_API_KEY || "AIzaSyDsBAc3y7deI5ZO3NtK5GuzKwtUzQNJNUk",

  govDataApiKey:
    env.REACT_GOV_DATA_API_KEY ||
    "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b",
  reCaptchaSiteKey:
    env.REACT_RECAPTCHA_SITE_KEY || "6LdvxuQUAAAAADDWVflgBqyHGfq-xmvNJaToM0pN",

  kasp: {
    enabled: env.REACT_KASP_ENABLED === "true",
    string: env.REACT_KASP_STRING || "KASP",
    fullString:
      env.REACT_KASP_FULL_STRING || "Karunya Arogya Suraksha Padhathi",
  },

  sampleFormats: {
    assetImport:
      env.REACT_SAMPLE_FORMAT_ASSET_IMPORT || "/asset-import-template.xlsx",
    externalResultImport:
      env.REACT_SAMPLE_FORMAT_EXTERNAL_RESULT_IMPORT ||
      "/External-Results-Template.csv",
  },

  wartimeShifting: env.REACT_WARTIME_SHIFTING === "true",

  auth: {
    tokenRefreshInterval: env.REACT_JWT_TOKEN_REFRESH_INTERVAL
      ? parseInt(env.REACT_JWT_TOKEN_REFRESH_INTERVAL)
      : 5 * 60e3,
  },

  minEncounterDate: new Date(env.REACT_MIN_ENCOUNTER_DATE || "2020-01-01"),

  // Plugins related configs...

  plausible: {
    server: env.REACT_PLAUSIBLE_SERVER_URL || "https://plausible.10bedicu.in",
    domain: env.REACT_PLAUSIBLE_SITE_DOMAIN || "care.ohc.network",
  },

  sentry: {
    dsn:
      env.REACT_SENTRY_DSN ||
      "https://8801155bd0b848a09de9ebf6f387ebc8@sentry.io/5183632",
    environment: env.REACT_SENTRY_ENVIRONMENT || "staging",
  },

  hcx: {
    enabled: env.REACT_ENABLE_HCX === "true",
  },

  abdm: {
    enabled: (env.REACT_ENABLE_ABDM ?? "true") === "true",
  },

  scribe: {
    enabled: env.REACT_ENABLE_SCRIBE === "true",
  },
} as const;

export default careConfig;
