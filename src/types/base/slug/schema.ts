import { t } from "i18next";
import { z } from "zod";

export const SLUG_VALUE_MIN_LENGTH = 5;
export const SLUG_VALUE_MAX_LENGTH = 36;

/**
 * Validation schema for slug values used in various resources.
 * Slug values must be between 5 and 36 characters, and can include letters, numbers, hyphens, and underscores.
 */
export const slugValueSchema = () => {
  const characterCountMessage = t("character_count_validation", {
    min: SLUG_VALUE_MIN_LENGTH,
    max: SLUG_VALUE_MAX_LENGTH,
  });

  return z
    .string()
    .trim()
    .min(SLUG_VALUE_MIN_LENGTH, { message: characterCountMessage })
    .max(SLUG_VALUE_MAX_LENGTH, { message: characterCountMessage })
    .regex(/^[a-z0-9-]+$/, {
      message: t("slug_format_message"),
    });
};
