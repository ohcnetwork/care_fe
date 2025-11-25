/**
 * Generate expected slug from title based on the application's slug generation logic
 * @param title - The title to convert to a slug
 * @returns The expected slug value
 */
export function generateExpectedSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").slice(0, 25);
}
