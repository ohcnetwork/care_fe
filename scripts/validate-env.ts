// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {
  ENCOUNTER_CLASS,
  ENCOUNTER_DISCHARGE_DISPOSITION,
  EncounterDischargeDisposition,
} from "../src/types/emr/encounter/encounter";

import { z } from "zod";

const logoSchema = z.object({
  light: z.string().url(),
  dark: z.string().url(),
});

const customShortcutSchema = z.array(
  z.object({
    title: z.string(),
    description: z.string(),
    href: z.string(),
    icon: z.string().optional(),
    visible: z.boolean().optional(),
  }),
);

const booleanAsStringSchema = z
  .string()
  .refine((val) => val === "true" || val === "false", {
    message: "Must be a boolean",
  });

const numberAsString = z.string().refine((val) => !isNaN(parseInt(val)), {
  message: "Must be a valid number",
});

const jsonAsStringSchema = z.string().refine(
  (val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Not a valid JSON string",
  },
);

const logoSchemaString = jsonAsStringSchema
  .transform((val) => JSON.parse(val))
  .pipe(logoSchema);

const customShortcutsSchemaString = jsonAsStringSchema
  .transform((val) => JSON.parse(val))
  .pipe(customShortcutSchema);

const VALID_ROUNDING_METHODS = [
  "ROUND_UP",
  "ROUND_DOWN",
  "ROUND_CEIL",
  "ROUND_FLOOR",
  "ROUND_HALF_UP",
  "ROUND_HALF_DOWN",
  "ROUND_HALF_EVEN",
  "ROUND_HALF_CEIL",
  "ROUND_HALF_FLOOR",
];

/**
 * Schema for API URL map - validates that all keys are valid origins
 * and all values are valid URLs
 */
const apiUrlMapSchema = jsonAsStringSchema
  .transform((val) => JSON.parse(val) as Record<string, string>)
  .refine(
    (map) => {
      return Object.entries(map).every(([origin, url]) => {
        try {
          new URL(origin);
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
    },
    {
      message:
        "All keys must be valid origins and all values must be valid URLs",
    },
  );

const envSchema = z
  .object({
    REACT_CARE_API_URL: z.string().url().optional(),
    REACT_CARE_URL_MAP: apiUrlMapSchema.optional(),
    REACT_APP_TITLE: z.string(),
    REACT_APP_META_DESCRIPTION: z.string(),
    REACT_PUBLIC_URL: z.string().url(),
    REACT_APP_COVER_IMAGE: z.string().url(),
    REACT_APP_COVER_IMAGE_ALT: z.string().url(),
    REACT_SBOM_BASE_URL: z.string().url().optional(),
    REACT_GITHUB_URL: z.string().url().optional(),
    REACT_OHCN_URL: z.string().url().optional(),
    REACT_SENTRY_DSN: z.string().url().optional(),
    REACT_SENTRY_ENVIRONMENT: z.string().optional(),
    REACT_DEFAULT_PAYMENT_TERMS: z.string().optional(),
    REACT_MAIN_LOGO: logoSchemaString.optional(),
    REACT_STATE_LOGO: logoSchemaString.optional(),
    REACT_CUSTOM_LOGO: logoSchemaString.optional(),
    REACT_CUSTOM_DESCRIPTION: z.string().optional(),
    REACT_CUSTOM_LOGO_ALT: logoSchemaString.optional(),
    REACT_MAPS_FALLBACK_URL_TEMPLATE: z.string().url().optional(),
    REACT_ENABLED_APPS: z.string().optional(),
    REACT_RECAPTCHA_SITE_KEY: z.string(),
    REACT_APP_MAX_IMAGE_UPLOAD_SIZE_MB: numberAsString.optional(),
    REACT_JWT_TOKEN_REFRESH_INTERVAL: numberAsString.optional(),
    REACT_DISABLE_PATIENT_LOGIN: booleanAsStringSchema.optional(),
    REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION: booleanAsStringSchema.optional(),
    REACT_APPOINTMENTS_DEFAULT_DATE_FILTER: numberAsString.optional(),
    REACT_PAYMENT_LOCATION_REQUIRED: booleanAsStringSchema.optional(),
    REACT_ENCOUNTER_DEFAULT_DATE_FILTER: numberAsString.optional(),
    REACT_ENABLE_AUTO_INVOICE_AFTER_DISPENSE: booleanAsStringSchema.optional(),
    REACT_ENABLE_TOKEN_GENERATION_IN_PATIENT_HOME:
      booleanAsStringSchema.optional(),
    REACT_INVENTORY_DEFAULT_TAX_INCLUSIVE: booleanAsStringSchema.optional(),
    REACT_INVENTORY_EXPIRY_MONTH_OFFSET: numberAsString.optional(),
    REACT_OPEN_SCHEDULE_AFTER_PATIENT_REGISTRATION:
      booleanAsStringSchema.optional(),
    REACT_OBSERVATION_PLOTS_CONFIG_URL: z.string().url().optional(),
    REACT_DEFAULT_COUNTRY: z.string().optional(),
    REACT_DEFAULT_COUNTRY_NAME: z.string().optional(),
    REACT_CDN_URLS: z
      .string()
      .optional()
      .transform((val) => val?.split(" "))
      .pipe(z.array(z.string().url()).optional())
      .describe("Optional: Space-separated list of CDN URLs"),
    REACT_ALLOWED_ENCOUNTER_CLASSES: z
      .string()
      .transform((val) => val.split(",").map((v) => v.trim()))
      .refine((values) => new Set(values).size === values.length, {
        message: "Duplicate encounter classes are not allowed",
      })
      .refine(
        (values) => values.every((v) => ENCOUNTER_CLASS.includes(v as any)),
        {
          message: "Invalid encounter classes",
        },
      )
      .optional(),
    REACT_ALLOWED_LOCALES: z.string().optional(),
    REACT_PATIENT_REG_MIN_GEO_ORG_LEVELS_REQUIRED: numberAsString.optional(),
    REACT_DEFAULT_ENCOUNTER_TYPE: z.string().optional(),
    REACT_DEFAULT_DISCHARGE_DISPOSITION: z.string().optional(),
    REACT_PATIENT_REGISTRATION_DEFAULT_GEO_ORG: z.string().uuid().optional(),
    REACT_CUSTOM_REMOTE_I18N_URL: z.string().url().optional(),
    REACT_CUSTOM_SHORTCUTS: customShortcutsSchemaString.optional(),
    REACT_AUTO_REFRESH_INTERVAL: numberAsString.optional(),
    REACT_AUTO_REFRESH_BY_DEFAULT: booleanAsStringSchema.optional(),
    REACT_APP_UPDATE_CHECK_INTERVAL: numberAsString.optional(),
    REACT_DECIMAL_PRECISION: numberAsString.optional(),
    REACT_ACCOUNTING_PRECISION: numberAsString.optional(),
    REACT_DECIMAL_ROUNDING_METHOD: z
      .string()
      .refine((val) => VALID_ROUNDING_METHODS.includes(val), {
        message: `Must be one of: ${VALID_ROUNDING_METHODS.join(", ")}`,
      })
      .optional(),
    REACT_MAX_FORM_DIALOG_FAVORITES: numberAsString.optional(),
  })
  .superRefine(async (data, ctx) => {
    // Ensure at least one API URL configuration is provided
    if (!data.REACT_CARE_API_URL && !data.REACT_CARE_URL_MAP) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Either REACT_CARE_API_URL or REACT_CARE_URL_MAP must be provided",
        path: ["REACT_CARE_API_URL"],
      });
    }

    const allowedClasses =
      data.REACT_ALLOWED_ENCOUNTER_CLASSES || ENCOUNTER_CLASS;

    if (
      data.REACT_DEFAULT_ENCOUNTER_TYPE &&
      !allowedClasses.includes(data.REACT_DEFAULT_ENCOUNTER_TYPE as any)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Encounter class not in allowed encounter classes",
        path: ["REACT_DEFAULT_ENCOUNTER_TYPE"],
      });
    }

    if (
      data.REACT_DEFAULT_DISCHARGE_DISPOSITION &&
      !ENCOUNTER_DISCHARGE_DISPOSITION.includes(
        data.REACT_DEFAULT_DISCHARGE_DISPOSITION as EncounterDischargeDisposition,
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid discharge disposition",
        path: ["REACT_DEFAULT_DISCHARGE_DISPOSITION"],
      });
    }

    if (
      (data.REACT_SENTRY_DSN && !data.REACT_SENTRY_ENVIRONMENT) ||
      (data.REACT_SENTRY_ENVIRONMENT && !data.REACT_SENTRY_DSN)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sentry environment and DSN are both required",
        path: ["REACT_SENTRY_ENVIRONMENT", "REACT_SENTRY_DSN"],
      });
    }
  });

export default async function validateEnv(
  env: Record<string, string | undefined>,
) {
  const result = await envSchema.safeParseAsync(env);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}
