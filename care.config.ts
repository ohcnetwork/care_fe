import { booleanFromString } from "@/common/utils";
import { PaymentReconciliationPaymentMethod } from "@/types/billing/paymentReconciliation/paymentReconciliation";
import {
  ENCOUNTER_CLASS,
  EncounterClass,
  EncounterDischargeDisposition,
} from "@/types/emr/encounter/encounter";

import { NonEmptyArray } from "@/Utils/types";
import Decimal from "decimal.js";
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

/**
 * Parse API URL map from environment variable.
 * Maps frontend origins (including port) to backend URLs.
 * Example: '{"http://localhost:3000": "http://careapi.localhost"}'
 */
const apiUrlMap: Record<string, string> = env.REACT_CARE_URL_MAP
  ? JSON.parse(env.REACT_CARE_URL_MAP)
  : {};

/**
 * Resolve API URL based on current origin.
 * Priority: mapped URL for current origin > REACT_CARE_API_URL fallback
 */
const resolveApiUrl = (): string => {
  if (typeof window !== "undefined") {
    const mappedUrl = apiUrlMap[window.location.origin];
    if (mappedUrl) return mappedUrl;
  }
  return env.REACT_CARE_API_URL ?? "";
};

const careConfig = {
  apiUrl: resolveApiUrl(),
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
   * App update check interval in milliseconds (env var in seconds, default: 86400 seconds = 24 hours)
   * Clamped to minimum 60 seconds to prevent accidental hot polling
   */
  appUpdateCheckInterval:
    Math.max(parseInt(env.REACT_APP_UPDATE_CHECK_INTERVAL || "86400", 10), 60) *
    1000,

  /**
   * Flag to make location field mandatory for payment reconciliation
   */
  paymentLocationRequired: booleanFromString(
    env.REACT_PAYMENT_LOCATION_REQUIRED,
    true,
  ),

  /**
   * Default payment method to preselect when recording a new payment
   * Valid values: cash, ccca, cchk, cdac, chck, ddpo, debc
   */
  defaultPaymentMethod: (() => {
    const method = env.REACT_DEFAULT_PAYMENT_METHOD;
    if (!method) return undefined;

    // Validate the payment method value
    const validMethods = Object.values(PaymentReconciliationPaymentMethod);
    if (validMethods.includes(method as PaymentReconciliationPaymentMethod)) {
      return method as PaymentReconciliationPaymentMethod;
    }

    console.warn(
      `Invalid REACT_DEFAULT_PAYMENT_METHOD: "${method}". Valid values are: ${validMethods.join(", ")}`,
    );
    return undefined;
  })(),

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
   * Show token generation button in patient home if set to "true"
   */
  enableTokenGenerationInPatientHome: booleanFromString(
    env.REACT_ENABLE_TOKEN_GENERATION_IN_PATIENT_HOME,
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
    /**
     * Number of months offset for expiry restriction.
     * 0 = current month, 1 = next month, etc.
     * Products expiring before the end of (current month + offset) will be restricted.
     * Set to null (default) to disable expiry restriction entirely.
     */
    expiryMonthOffset: env.REACT_INVENTORY_EXPIRY_MONTH_OFFSET
      ? parseInt(env.REACT_INVENTORY_EXPIRY_MONTH_OFFSET, 10)
      : null,
  },

  /**
   * Open schedule window automatically after patient registration if set to "true"
   */
  openScheduleAfterPatientRegistration: booleanFromString(
    env.REACT_OPEN_SCHEDULE_AFTER_PATIENT_REGISTRATION,
    false,
  ),

  /**
   * Decimal calculation configuration
   */
  decimal: {
    /**
     * Maximum precision for decimal calculations (max_digits in backend)
     */
    precision: env.REACT_DECIMAL_PRECISION
      ? parseInt(env.REACT_DECIMAL_PRECISION, 10)
      : 20,

    /**
     * Accounting display precision
     * Matches backend `ACCOUNTING_PRECISION` config
     */
    accountingPrecision: env.REACT_ACCOUNTING_PRECISION
      ? parseInt(env.REACT_ACCOUNTING_PRECISION, 10)
      : 2,

    /**
     * Rounding method for decimal calculations
     * Matches backend `DECIMAL_ROUNDING_METHOD` config
     */
    rounding: (() => {
      const method = (env.REACT_DECIMAL_ROUNDING_METHOD || "ROUND_HALF_UP") as
        | "ROUND_UP"
        | "ROUND_DOWN"
        | "ROUND_CEIL"
        | "ROUND_FLOOR"
        | "ROUND_HALF_UP"
        | "ROUND_HALF_DOWN"
        | "ROUND_HALF_EVEN"
        | "ROUND_HALF_CEIL"
        | "ROUND_HALF_FLOOR";
      return Decimal[method] as Decimal.Rounding;
    })(),
  },

  /**
   * Maximum number of forms that can be favorited in the forms dialog
   */
  maxFormDialogFavorites: env.REACT_MAX_FORM_DIALOG_FAVORITES
    ? parseInt(env.REACT_MAX_FORM_DIALOG_FAVORITES, 10)
    : 5,
} as const;

export default careConfig;
