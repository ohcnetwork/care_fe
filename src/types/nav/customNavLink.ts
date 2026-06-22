import { z } from "zod";

/**
 * Sidebar contexts a custom nav link can be placed in.
 * "all" makes the link appear in every context (persistent surface).
 */
export const NAV_SCOPES = [
  "facility",
  "organization",
  "location",
  "service",
  "admin",
  "patient",
  "all",
] as const;

export type NavScope = (typeof NAV_SCOPES)[number];

/**
 * A single custom navigation link, sourced from the `REACT_CUSTOM_NAV_LINKS`
 * env config or a plugin manifest.
 *
 * - `title`: display label, passed through i18n (falls back to literal text).
 * - `url`: internal route path, or an absolute http(s) URL when `external`.
 * - `icon`: optional name from the allow-listed lucide-react icons.
 * - `external`: marks the url as outside the app (rendered as a sanitized anchor).
 * - `openInNewTab`: open in a new tab; defaults to the value of `external`.
 * - `placement`: sidebar contexts the link appears in; defaults to every context.
 */
export const customNavLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  icon: z.string().optional(),
  external: z.boolean().optional(),
  openInNewTab: z.boolean().optional(),
  placement: z.array(z.enum(NAV_SCOPES)).default(["all"]),
});

export type CustomNavLink = z.infer<typeof customNavLinkSchema>;

export const customNavLinksSchema = z.array(customNavLinkSchema);
