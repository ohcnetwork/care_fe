import {
  Book,
  BookOpen,
  Box,
  Building2,
  Calendar,
  Database,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Link as LinkIcon,
  LucideIcon,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { NavigationLink } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

import {
  CustomNavLink,
  NavScope,
  customNavLinksSchema,
} from "@/types/nav/customNavLink";

import { isSafeNavUrl } from "@/Utils/url";

import careConfig from "@careConfig";

/**
 * Allow-list of icon names that can be referenced from configuration.
 * Restricting the set avoids importing the entire lucide library and keeps
 * untrusted config from rendering arbitrary components.
 */
const iconMap: Record<string, LucideIcon> = {
  Book,
  BookOpen,
  Box,
  Building2,
  Calendar,
  Database,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Link: LinkIcon,
  Settings,
  Stethoscope,
  Users,
};

function parseLinks(value: unknown): CustomNavLink[] {
  const result = customNavLinksSchema.safeParse(value ?? []);
  return result.success ? result.data : [];
}

/**
 * Resolves the custom navigation links configured for a given sidebar scope.
 *
 * Links are sourced from the deployment env (`careConfig.customNavLinks`) and
 * from loaded plugin manifests (`customNavLinks`), then filtered by placement
 * and nav-URL safety before being mapped to `NavigationLink`s that `NavMain`
 * can render.
 */
export function useCustomNavLinks(scope: NavScope): NavigationLink[] {
  const { t } = useTranslation();
  const careApps = useCareApps();

  const envLinks = parseLinks(careConfig.customNavLinks);
  const pluginLinks = parseLinks(
    careApps.flatMap((app) =>
      !app.isLoading && app.customNavLinks ? app.customNavLinks : [],
    ),
  );

  return [...envLinks, ...pluginLinks]
    .filter(
      (link) =>
        link.placement.includes(scope) || link.placement.includes("all"),
    )
    .filter(
      (link) => !(link.external || link.openInNewTab) || isSafeNavUrl(link.url),
    )
    .map((link) => {
      const Icon = link.icon ? iconMap[link.icon] : undefined;
      return {
        name: t(link.title),
        url: link.url,
        external: link.external,
        openInNewTab: link.openInNewTab ?? link.external,
        icon: Icon ? <Icon /> : undefined,
      } satisfies NavigationLink;
    });
}
