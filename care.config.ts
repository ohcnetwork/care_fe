import { CountryCode } from "libphonenumber-js/types.cjs";

import {
  ENCOUNTER_CLASS,
  EncounterClass,
} from "@/types/emr/encounter/encounter";
import { NonEmptyArray } from "@/Utils/types";

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
  encounterClasses: (env.REACT_ALLOWED_ENCOUNTER_CLASSES?.split(",") ??
    ENCOUNTER_CLASS) as NonEmptyArray<EncounterClass>,

  defaultEncounterType: (env.REACT_DEFAULT_ENCOUNTER_TYPE ||
    "hh") as EncounterClass,

  mapFallbackUrlTemplate:
    env.REACT_MAPS_FALLBACK_URL_TEMPLATE ||
    "https://www.openstreetmap.org/?mlat={lat}&mlon={long}&zoom=15",

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

  /**
   * Relative number of days to show in the encounters page by default.
   * 0 means today.
   */
  encounterDateFilter: env.REACT_ENCOUNTER_DEFAULT_DATE_FILTER
    ? parseInt(env.REACT_ENCOUNTER_DEFAULT_DATE_FILTER)
    : 0,

  appointments: {
    /**
     * Relative number of days to show in the appointments page by default.
     * 0 means today, positive for future days, negative for past days.
     */
    defaultDateFilter: env.REACT_APPOINTMENTS_DEFAULT_DATE_FILTER
      ? parseInt(env.REACT_APPOINTMENTS_DEFAULT_DATE_FILTER)
      : 0,

    // Kill switch in-case the heatmap API doesn't scale as expected
    useAvailabilityStatsAPI: boolean(
      "REACT_APPOINTMENTS_USE_AVAILABILITY_STATS_API",
      true,
    ),
  },

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

  /**
   * Disable patient login if set to "true"
   */
  disablePatientLogin: boolean("REACT_DISABLE_PATIENT_LOGIN", false),

  patientRegistration: {
    /**
     * Minimum number of geo-organization levels the user must select
     * during patient registration.
     *
     * If not set, all levels are required.
     */
    minGeoOrganizationLevelsRequired:
      env.REACT_PATIENT_REG_MIN_GEO_ORG_LEVELS_REQUIRED
        ? Math.max(
            parseInt(env.REACT_PATIENT_REG_MIN_GEO_ORG_LEVELS_REQUIRED, 10),
            1,
          )
        : undefined,

    defaultGeoOrganization: env.REACT_PATIENT_REGISTRATION_DEFAULT_GEO_ORG,

    minimalPatientRegistration: boolean(
      "REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION",
      false,
    ),
  },
} as const;

export default careConfig;
