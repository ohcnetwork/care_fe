import type { ReactNode } from "react";
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
 * A supplementary sidebar link from env (`REACT_CUSTOM_NAV_LINKS`) or a plugin
 * manifest (`customNavItems`). Same shape for both sources.
 *
 * - `name`: display label, passed through i18n (falls back to literal text).
 * - `url`: internal route path ("/...") or an absolute http(s) URL. Absolute
 *   http(s) URLs are treated as external automatically (rendered as a sanitized
 *   anchor); anything else must be an internal path.
 * - `openInNewTab`: open in a new tab; defaults to true for absolute http(s) URLs.
 * - `placement`: sidebar contexts the link appears in; defaults to every context.
 *
 * Icons are assigned automatically: Lucide `ExternalLink` for http(s) URLs,
 * Lucide `Link` for internal paths. Plugins may override this with a custom
 * `icon` (see `PluginNavLink`); env links always use the automatic icon.
 */
export const customNavLinkSchema = z.object({
  name: z.string(),
  url: z.string(),
  openInNewTab: z.boolean().optional(),
  placement: z.array(z.enum(NAV_SCOPES)).default(["all"]),
});

/** Config shape for env JSON and plugin `customNavItems` entries. */
export type CustomNavLink = z.input<typeof customNavLinkSchema>;

/**
 * Plugin variant of {@link CustomNavLink} that may carry a custom `icon`.
 * When `icon` is omitted, the automatic URL-based icon is used. Not available
 * for env links, whose JSON config cannot hold React elements.
 */
export type PluginNavLink = CustomNavLink & { icon?: ReactNode };

export const customNavLinksSchema = z.array(customNavLinkSchema);
