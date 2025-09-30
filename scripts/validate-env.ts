import { z } from "zod";
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { ENCOUNTER_CLASS } from "../src/types/emr/encounter/encounter";

const logoSchema = z.object({
  light: z.string().url(),
  dark: z.string().url(),
});

const logoSchemaString = z
  .string()
  .refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Logo must be a valid JSON string",
    },
  )
  .transform((val) => JSON.parse(val))
  .pipe(logoSchema);

const envSchema = z
  .object({
    REACT_CARE_API_URL: z.string().url(),
    REACT_APP_TITLE: z.string(),
    REACT_APP_META_DESCRIPTION: z.string(),
    REACT_PUBLIC_URL: z.string().url(),
    REACT_APP_COVER_IMAGE: z.string().url(),
    REACT_APP_COVER_IMAGE_ALT: z.string().url(),
    REACT_SBOM_BASE_URL: z.string().url(),
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
    REACT_APP_MAX_IMAGE_UPLOAD_SIZE_MB: z.string().optional(),
    REACT_JWT_TOKEN_REFRESH_INTERVAL: z
      .string()
      .refine(
        (val) => {
          parseInt(val);
        },
        {
          message: "Must be a valid number",
        },
      )
      .optional(),
    REACT_DISABLE_PATIENT_LOGIN: z.string().refine(
      (val) => {
        const bool = val === "true" || val === "false";
        return bool;
      },
      {
        message: "Must be a boolean",
      },
    ),
    REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION: z.string().refine(
      (val) => {
        const bool = val === "true" || val === "false";
        return bool;
      },
      {
        message: "Must be a boolean",
      },
    ),
    REACT_APPOINTMENTS_DEFAULT_DATE_FILTER: z
      .string()
      .refine(
        (val) => {
          parseInt(val);
        },
        {
          message: "Must be a valid number",
        },
      )
      .optional(),
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
        message: "Duplicate encounter classes",
      })
      .refine(
        (values) => values.every((v) => ENCOUNTER_CLASS.includes(v as any)),
        {
          message: "Invalid encounter classes",
        },
      )
      .optional(),
    REACT_ALLOWED_LOCALES: z.string().optional(),
    REACT_PATIENT_REG_MIN_GEO_ORG_LEVELS_REQUIRED: z
      .string()
      .refine(
        (val) => {
          const num = parseInt(val);
          return 1 <= num && num <= 50;
        },
        {
          message:
            "Must be greater than or equal to  1 and less than or equal to 50",
        },
      )
      .optional(),
    REACT_DEFAULT_ENCOUNTER_TYPE: z.string().optional(),
    REACT_PATIENT_REGISTRATION_DEFAULT_GEO_ORG: z.string().optional(),
  })
  .superRefine(async (data, ctx) => {
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

    if (data.REACT_PATIENT_REGISTRATION_DEFAULT_GEO_ORG) {
      const response = await fetch(
        `${data.REACT_CARE_API_URL}/api/v1/govt/organization/${data.REACT_PATIENT_REGISTRATION_DEFAULT_GEO_ORG}/`,
      );
      if (!response.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid geo organization",
          path: ["REACT_PATIENT_REGISTRATION_DEFAULT_GEO_ORG"],
        });
      }
    }
    if (
      (data.REACT_SENTRY_DSN && !data.REACT_SENTRY_ENVIRONMENT) ||
      (data.REACT_SENTRY_ENVIRONMENT && !data.REACT_SENTRY_DSN)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sentry environment and DSN are required together",
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
