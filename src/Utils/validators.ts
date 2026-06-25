import { t } from "i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

import { SLUG_VALUE_MAX_LENGTH } from "@/types/base/slug/schema";

/**
 * Generates a URL-safe slug from a given string.
 *
 * @param title - The string to convert to a slug
 * @returns A URL-safe slug string
 *
 * @example
 * generateSlugValue("Hello World!") // "hello-world"
 * generateSlugValue("Café & Résumé") // "cafe-resume"
 * generateSlugValue("Special @#$% Characters") // "special-characters"
 */
export function generateSlugValue(title: string | undefined): string {
  if (!title || typeof title !== "string") {
    return "";
  }

  return (
    title
      // Convert to lowercase
      .toLowerCase()
      // Normalize unicode characters (handles accented characters)
      .normalize("NFD")
      // Remove diacritics (accents, umlauts, etc.)
      .replace(/[\u0300-\u036f]/g, "")
      // Replace special characters and spaces with hyphens
      .replace(/[^\w\s-]/g, "")
      // Replace multiple spaces or hyphens with single hyphen
      .replace(/[\s-]+/g, "-")
      // Remove leading and trailing hyphens or underscores
      .replace(/^[-_]+|[-_]+$/g, "")
      // Limit length
      .slice(0, SLUG_VALUE_MAX_LENGTH)
      // Remove trailing hyphens or underscores after truncation
      .replace(/[-_]+$/, "")
  );
}

export default () => ({
  phoneNumber: {
    optional: z
      .string()
      .optional()
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: t("phone_number_validation_error"),
      }),

    required: z
      .string()
      .min(1, { message: t("field_required") })
      .refine((val) => isValidPhoneNumber(val), {
        message: t("phone_number_validation_error"),
      }),
  },

  coordinates: {
    latitude: z
      .number()
      .min(-90, t("invalid_latitude"))
      .max(90, t("invalid_latitude")),

    longitude: z
      .number()
      .min(-180, t("invalid_longitude"))
      .max(180, t("invalid_longitude")),
  },

  pincode: z
    .number()
    .int()
    .positive()
    .min(100000, t("pincode_must_be_6_digits"))
    .max(999999, t("pincode_must_be_6_digits")),

  age: z
    .number()
    .int()
    .positive()
    .min(1, t("age_must_be_positive"))
    .max(120, t("age_must_be_below_120")),
});
