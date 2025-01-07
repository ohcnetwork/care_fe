import { EncounterClass } from "@/types/emr/encounter";

const env = import.meta.env;

interface ILogo {
  light: string;
  dark: string;
}

const boolean = (key: string, fallback = false) => {
  if (env[key] === "true") return true;
  if (env[key] === "false") return false;
  return fallback;
};

const logo = (value?: string, fallback?: ILogo) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as ILogo;
  } catch {
    return fallback;
  }
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
    light: "/images/care_logo.svg",
    dark: "/images/care_logo.svg",
  }),
  stateLogo: logo(env.REACT_STATE_LOGO),
  customLogo: logo(env.REACT_CUSTOM_LOGO),
  customLogoAlt: logo(env.REACT_CUSTOM_LOGO_ALT),
  customDescription: env.REACT_CUSTOM_DESCRIPTION,
  availableLocales: (env.REACT_ALLOWED_LOCALES || "")
    .split(",")
    .map((l) => l.trim()),

  defaultEncounterType: (env.REACT_DEFAULT_ENCOUNTER_TYPE ||
    "hh") as EncounterClass,

  gmapsApiKey:
    env.REACT_GMAPS_API_KEY || "AIzaSyDsBAc3y7deI5ZO3NtK5GuzKwtUzQNJNUk",

  govDataApiKey:
    env.REACT_GOV_DATA_API_KEY ||
    "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b",
  reCaptchaSiteKey:
    env.REACT_RECAPTCHA_SITE_KEY || "6LdvxuQUAAAAADDWVflgBqyHGfq-xmvNJaToM0pN",

  sampleFormats: {
    assetImport:
      env.REACT_SAMPLE_FORMAT_ASSET_IMPORT || "/asset-import-template.xlsx",
  },

  wartimeShifting: boolean("REACT_WARTIME_SHIFTING"),

  stillWatching: {
    idleTimeout: env.REACT_STILL_WATCHING_IDLE_TIMEOUT
      ? parseInt(env.REACT_STILL_WATCHING_IDLE_TIMEOUT)
      : 3 * 60,
    promptDuration: env.REACT_STILL_WATCHING_PROMPT_DURATION
      ? parseInt(env.REACT_STILL_WATCHING_PROMPT_DURATION)
      : 30,
  },

  auth: {
    tokenRefreshInterval: env.REACT_JWT_TOKEN_REFRESH_INTERVAL
      ? parseInt(env.REACT_JWT_TOKEN_REFRESH_INTERVAL)
      : 5 * 60e3,
  },

  minEncounterDate: new Date(env.REACT_MIN_ENCOUNTER_DATE || "2020-01-01"),

  // Plugins related configs...
  sentry: {
    dsn:
      env.REACT_SENTRY_DSN ||
      "https://8801155bd0b848a09de9ebf6f387ebc8@sentry.io/5183632",
    environment: env.REACT_SENTRY_ENVIRONMENT || "staging",
  },

  hcx: {
    enabled: boolean("REACT_ENABLE_HCX"),
  },

  abdm: {
    enabled: boolean("REACT_ENABLE_ABDM", true),
  },

  appointments: {
    // Kill switch in-case the heatmap API doesn't scale as expected
    useAvailabilityStatsAPI: boolean(
      "REACT_APPOINTMENTS_USE_AVAILABILITY_STATS_API",
      true,
    ),
  },

  careApps: env.REACT_ENABLED_APPS
    ? env.REACT_ENABLED_APPS.split(",").map((app) => ({
        branch: app.split("@")[1],
        package: app.split("@")[0],
      }))
    : [],

  plotsConfigUrl:
    env.REACT_OBSERVATION_PLOTS_CONFIG_URL || "/config/plots.json",
} as const;

export default careConfig;
