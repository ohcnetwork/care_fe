import { LucideIcon } from "lucide-react";

export interface CustomDashboardLink {
  title: string;
  description: string;
  href: string;
  icon?: string; // Icon name from lucide-react
  visible?: boolean;
}

export interface DashboardLinkContext {
  facilityId?: string;
  userId?: string;
  username?: string;
  [key: string]: string | undefined;
}

/**
 * Replaces placeholders in a string with values from context
 * @param template - String with placeholders like {facilityId}
 * @param context - Object containing replacement values
 * @returns String with placeholders replaced
 */
export function replacePlaceholders(
  template: string,
  context: DashboardLinkContext,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] || match;
  });
}

/**
 * Processes custom dashboard links by replacing placeholders in href only and mapping icons
 * @param links - Array of custom dashboard links from environment
 * @param context - Context object for placeholder replacement
 * @param iconMap - Map of icon names to Lucide React components
 * @returns Processed dashboard links ready for rendering
 */
export function processCustomDashboardLinks(
  links: CustomDashboardLink[],
  context: DashboardLinkContext,
  iconMap: Record<string, LucideIcon>,
): Array<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  visible: boolean;
}> {
  return links
    .map((link) => ({
      ...link,
      // Only replace placeholders in href, keep title and description as-is
      href: replacePlaceholders(link.href, context),
      icon: link.icon && iconMap[link.icon] ? iconMap[link.icon] : iconMap.Box, // Default to Box icon
      visible: link.visible !== false, // Default to true unless explicitly false
    }))
    .filter((link) => link.visible);
}
