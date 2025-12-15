import { booleanFromString } from "@/common/utils";
import {
  ENCOUNTER_CLASS,
  EncounterClass,
  EncounterDischargeDisposition,
} from "@/types/emr/encounter/encounter";

import { NonEmptyArray } from "@/Utils/types";
import { CountryCode } from "libphonenumber-js/types.cjs";

const env = import.meta.env;

interface ILogo {
  light: string;
  dark: string;
}

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
    github: env.REACT_GITHUB_URL || "https://github.com/ohcnetwork",
    ohcn: env.REACT_OHCN_URL || "https://ohc.network?ref=care",
  },

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

  defaultEncounterType:
    (env.REACT_DEFAULT_ENCOUNTER_TYPE as EncounterClass) ||
    (env.REACT_ALLOWED_ENCOUNTER_CLASSES?.split(",").length === 1
      ? (env.REACT_ALLOWED_ENCOUNTER_CLASSES?.split(",")[0] as EncounterClass)
      : undefined),

  defaultDischargeDisposition: env.REACT_DEFAULT_DISCHARGE_DISPOSITION as
    | EncounterDischargeDisposition
    | undefined,

  mapFallbackUrlTemplate:
    env.REACT_MAPS_FALLBACK_URL_TEMPLATE ||
    "https://www.openstreetmap.org/?mlat={lat}&mlon={long}&zoom=15",

  reCaptchaSiteKey: env.REACT_RECAPTCHA_SITE_KEY,

  auth: {
    tokenRefreshInterval: env.REACT_JWT_TOKEN_REFRESH_INTERVAL
      ? parseInt(env.REACT_JWT_TOKEN_REFRESH_INTERVAL)
      : 5 * 60e3,
  },

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
    useAvailabilityStatsAPI: booleanFromString(
      env.REACT_APPOINTMENTS_USE_AVAILABILITY_STATS_API,
      true,
    ),
  },

  /**
   * Auto refresh interval in milliseconds
   */
  appointmentAndQueueRefreshInterval:
    parseInt(env.REACT_AUTO_REFRESH_INTERVAL || "10", 10) * 1000,

  /**
   * Flag to make location field mandatory for payment reconciliation
   */
  paymentLocationRequired: booleanFromString(
    env.REACT_PAYMENT_LOCATION_REQUIRED,
    true,
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

  /**
   * Disable patient login if set to "true"
   */
  disablePatientLogin: booleanFromString(
    env.REACT_DISABLE_PATIENT_LOGIN,
    false,
  ),

  /**
   * Enable auto refresh if set to "true"
   */
  enableAutoRefresh: booleanFromString(
    env.REACT_AUTO_REFRESH_BY_DEFAULT,
    false,
  ),

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

    minimalPatientRegistration: booleanFromString(
      env.REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION,
      false,
    ),
  },

  i18nUrl: env.REACT_CUSTOM_REMOTE_I18N_URL,

  /**
   * Custom shortcuts configuration from environment variables
   * Format: JSON string with array of shortcut objects
   * Each shortcut can have: title, description, href, icon (optional)
   * Placeholders like {facilityId}, {userId} will be replaced at runtime
   */
  customShortcuts: env.REACT_CUSTOM_SHORTCUTS
    ? JSON.parse(env.REACT_CUSTOM_SHORTCUTS)
    : [],
  /**
   * System identifier for patient phone number configuration
   */
  phoneNumberConfigSystem: "system.care.ohc.network/patient-phone-number",

  /**
   * Enable automatic invoice sheet after dispensing items
   */
  enableAutoInvoiceAfterDispense: booleanFromString(
    env.REACT_ENABLE_AUTO_INVOICE_AFTER_DISPENSE,
    false,
  ),

  /**
   * Default state for tax inclusive pricing in inventory
   * When true, base price is calculated from MRP by removing tax
   */
  inventory: {
    defaultTaxInclusive: booleanFromString(
      env.REACT_INVENTORY_DEFAULT_TAX_INCLUSIVE,
      false,
    ),
  },
} as const;

export default careConfig;
