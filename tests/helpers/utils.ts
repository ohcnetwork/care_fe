/**
 * Generate expected slug from title
 * @param title - The title to convert to a slug
 * @returns The expected slug value
 */
export function expectedSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").slice(0, 25);
}
