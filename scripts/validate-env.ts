import { z } from "zod";
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { ENCOUNTER_CLASS } from "../src/types/emr/encounter/encounter";

const envSchema = z
  .object({
    REACT_CARE_API_URL: z.string().url(),
    REACT_SENTRY_DSN: z.string().url().optional(),
    REACT_SENTRY_ENVIRONMENT: z.string().optional(),
    REACT_DEFAULT_PAYMENT_TERMS: z.string().optional(),
    REACT_CDN_URLS: z
      .string()
      .optional()
      .transform((val) => val?.split(" "))
      .pipe(z.array(z.string().url()).optional())
      .describe("Optional: Space-separated list of CDN URLs"),
    REACT_ALLOWED_ENCOUNTER_CLASSES: z
      .string()
      .transform((val) => val.split(",").map((v) => v.trim()))
      .refine(
        (values) => values.every((v) => ENCOUNTER_CLASS.includes(v as any)),
        {
          message: "Invalid encounter classes",
        },
      )
      .optional(),
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
    if (data.REACT_SENTRY_DSN) {
      if (!data.REACT_SENTRY_ENVIRONMENT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sentry environment is required when Sentry DSN is set",
          path: ["REACT_SENTRY_ENVIRONMENT"],
        });
      }
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
