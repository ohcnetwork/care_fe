import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { NavigationLink } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

import {
  type CustomNavLink,
  type NavScope,
  customNavLinkSchema,
} from "@/types/nav/customNavLink";

import { isSafeExternalUrl, isSafeNavUrl } from "@/Utils/url";

import careConfig from "@careConfig";

function parseLinks(value: unknown): CustomNavLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = customNavLinkSchema.safeParse(item);
    if (parsed.success) return [parsed.data];
    if (import.meta.env.DEV) {
      console.warn("Skipping invalid custom nav link:", parsed.error.issues);
    }
    return [];
  });
}

/** Static at build time; validated once when the module loads. */
const envCustomNavLinks = parseLinks(careConfig.customNavLinks);

function matchesScope(placement: NavScope[], scope: NavScope): boolean {
  return placement.includes(scope) || placement.includes("all");
}

function resolveCustomNavIcon(url: string) {
  const Icon = isSafeExternalUrl(url) ? ExternalLink : LinkIcon;
  return <Icon className="!h-3.5 !w-4 shrink-0" />;
}

function toNavigationLink(
  link: CustomNavLink,
  t: (key: string) => string,
): NavigationLink {
  return {
    name: t(link.name),
    url: link.url,
    openInNewTab: link.openInNewTab ?? isSafeExternalUrl(link.url),
    icon: resolveCustomNavIcon(link.url),
  };
}

/**
 * Resolves custom sidebar links for a given scope from env config and plugins.
 *
 * - Env (`REACT_CUSTOM_NAV_LINKS`): JSON config; icons are auto-assigned from URL.
 * - Plugins (`customNavItems`): manifest entries with the same icon rules.
 */
export function useCustomNavLinks(scope: NavScope): NavigationLink[] {
  const { t } = useTranslation();
  const careApps = useCareApps();

  const links = [
    ...envCustomNavLinks,
    ...careApps.flatMap((app) =>
      !app.isLoading && app.customNavItems ? app.customNavItems : [],
    ),
  ];

  return links
    .filter((link) => matchesScope(link.placement ?? ["all"], scope))
    .filter((link) => isSafeNavUrl(link.url))
    .map((link) => toNavigationLink(link, t));
}
