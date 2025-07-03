import { CountryCode } from "libphonenumber-js/types.cjs";

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
  sbomBaseUrl: env.REACT_SBOM_BASE_URL || "https://sbom.ohc.network",
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

  mapFallbackUrlTemplate:
    env.REACT_MAPS_FALLBACK_URL_TEMPLATE ||
    "https://www.openstreetmap.org/?mlat={lat}&mlon={long}&zoom=15",

  gmapsApiKey:
    env.REACT_GMAPS_API_KEY || "AIzaSyDsBAc3y7deI5ZO3NtK5GuzKwtUzQNJNUk",

  reCaptchaSiteKey: env.REACT_RECAPTCHA_SITE_KEY,

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

  appointments: {
    /**
     * Relative number of days to show in the appointments page by default.
     * 0 means today, positive for future days, negative for past days.
     */
    defaultDateFilter: env.REACT_APPOINTMENTS_DEFAULT_DATE_FILTER
      ? parseInt(env.REACT_APPOINTMENTS_DEFAULT_DATE_FILTER)
      : 7,

    // Kill switch in-case the heatmap API doesn't scale as expected
    useAvailabilityStatsAPI: boolean(
      "REACT_APPOINTMENTS_USE_AVAILABILITY_STATS_API",
      true,
    ),
  },

  enableMinimalPatientRegistration: boolean(
    "REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION",
    false,
  ),

  careApps: env.REACT_ENABLED_APPS
    ? env.REACT_ENABLED_APPS.split(",").map((app) => {
        const [module, cdn] = app.split("@");
        const [org, repo] = module.split("/");

        if (!org || !repo) {
          throw new Error(
            `Invalid plug configuration: ${module}. Expected 'org/repo@url'.`,
          );
        }

        let url = "";
        if (!cdn) {
          url = `https://${org}.github.io/${repo}`;
        }

        if (!url.startsWith("http")) {
          url = `${cdn.includes("localhost") ? "http" : "https"}://${cdn}`;
        }

        return {
          url: new URL(url).toString(),
          name: repo,
          package: module,
        };
      })
    : [],

  plotsConfigUrl:
    env.REACT_OBSERVATION_PLOTS_CONFIG_URL || "/config/plots.json",

  defaultCountry: {
    code: (env.REACT_DEFAULT_COUNTRY || "IN") as CountryCode,
    name: env.REACT_DEFAULT_COUNTRY_NAME || "India",
  },

  resendOtpTimeout: env.REACT_APP_RESEND_OTP_TIMEOUT
    ? parseInt(env.REACT_APP_RESEND_OTP_TIMEOUT, 10)
    : 30,

  imageUploadMaxSizeInMB: env.REACT_APP_MAX_IMAGE_UPLOAD_SIZE_MB
    ? parseInt(env.REACT_APP_MAX_IMAGE_UPLOAD_SIZE_MB, 10)
    : 2,
} as const;

export default careConfig;
