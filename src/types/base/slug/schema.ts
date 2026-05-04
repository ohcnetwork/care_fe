import { t } from "i18next";
import { z } from "zod";

/**
 * Validation schema for slug values used in various resources.
 * Slug values must be between 5 and 36 characters, and can include letters, numbers, hyphens, and underscores.
 */
export const slugValueSchema = () => {
  const characterCountMessage = t("character_count_validation", {
    min: 5,
    max: 36,
  });

  return z
    .string()
    .trim()
    .min(5, { message: characterCountMessage })
    .max(36, { message: characterCountMessage })
    .regex(/^[a-z0-9-]+$/, {
      message: t("slug_format_message"),
    });
};
