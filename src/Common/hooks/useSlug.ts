import { usePath } from "raviger";

/**
 * Returns the slug from the current path.
 * @param prefix The prefix of the slug.
 * @returns The slug.
 * @example
 * // Current path: /consultation/94b9a
 * const consultation = useSlug("consultation"); // consultation = "94b9a"
 */
export default function useSlug(prefix: string, fallback?: string) {
  const path = usePath() ?? "";
  return findSlug(path.split("/"), prefix, fallback);
}

/**
 * Returns the slugs from the current path.
 * @param prefix The prefixes of the slug.
 * @returns The slugs
 * @example
 * // Current path: /facility/5b0a/consultation/94b9a
 * const [facility, consultation] = useSlug("facility", "consultation");
 * // facility = "5b0a"
 * // consultation = "94b9a"
 */
export const useSlugs = (...prefix: string[]) => {
  const path = usePath() ?? "";
  return prefix.map((p) => findSlug(path.split("/"), p));
};

const findSlug = (segments: string[], prefix: string, fallback?: string) => {
  const index = segments.findIndex((segment) => segment === prefix);
  if (index === -1) {
    if (fallback) {
      return fallback;
    }
    throw new Error(
      `Prefix "${prefix}" not found in path "${segments.join("/")}"`,
    );
  }

  const slug = segments[index + 1] ?? fallback;
  if (slug === undefined) {
    throw new Error(`Slug not found in path "${segments.join("/")}"`);
  }

  return slug;
};
