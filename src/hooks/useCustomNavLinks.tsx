import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { isValidElement } from "react";
import { useTranslation } from "react-i18next";

import type { NavigationLink } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

import {
  type NavScope,
  type PluginNavLink,
  customNavLinkSchema,
} from "@/types/nav/customNavLink";

import { isSafeExternalUrl, isSafeNavUrl } from "@/Utils/url";

import careConfig from "@careConfig";

function parseLinks(value: unknown): PluginNavLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = customNavLinkSchema.safeParse(item);
    if (parsed.success) {
      const icon = isValidElement(item?.icon) ? item.icon : undefined;
      return [{ ...parsed.data, icon }];
    }
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
  return <Icon className="h-3.5! w-4! shrink-0" />;
}

function toNavigationLink(
  link: PluginNavLink,
  t: (key: string) => string,
): NavigationLink {
  return {
    name: t(link.name),
    url: link.url,
    openInNewTab: link.openInNewTab ?? isSafeExternalUrl(link.url),
    icon: link.icon ?? resolveCustomNavIcon(link.url),
  };
}

/**
 * Resolves custom sidebar links for a given scope from env config and plugins.
 *
 * - Env (`REACT_CUSTOM_NAV_LINKS`): JSON config; icons are auto-assigned from URL.
 * - Plugins (`customNavItems`): validated with the same schema as env links; may
 *   provide a custom `icon`, falling back to the auto-assigned URL icon when omitted.
 */
export function useCustomNavLinks(scope: NavScope): NavigationLink[] {
  const { t } = useTranslation();
  const careApps = useCareApps();

  const links = [
    ...envCustomNavLinks,
    ...parseLinks(
      careApps.flatMap((app) =>
        !app.isLoading && app.customNavItems ? app.customNavItems : [],
      ),
    ),
  ];

  return links
    .filter((link) => matchesScope(link.placement ?? ["all"], scope))
    .filter((link) => isSafeNavUrl(link.url))
    .map((link) => toNavigationLink(link, t));
}
