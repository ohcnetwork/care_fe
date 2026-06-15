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
