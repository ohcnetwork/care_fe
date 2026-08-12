import { type ComponentType } from "react";

import {
  AppointmentDuoIcon,
  BoxDuoIcon,
  CalendarDuoIcon,
  ChartDuoIcon,
  DatabaseDuoIcon,
  HeartDuoIcon,
  StethoscopeDuoIcon,
  UsersDuoIcon,
} from "@/CAREUI/icons/CustomIcons";

export type DashboardShortcutIcon = ComponentType<{ className?: string }>;

export const DASHBOARD_SHORTCUT_ICONS = {
  Appointment: AppointmentDuoIcon,
  Calendar: CalendarDuoIcon,
  Stethoscope: StethoscopeDuoIcon,
  Heart: HeartDuoIcon,
  Chart: ChartDuoIcon,
  User: UsersDuoIcon,
  /** @deprecated Use `User`. Kept so existing REACT_CUSTOM_SHORTCUTS configs keep working. */
  Users: UsersDuoIcon,
  Box: BoxDuoIcon,
  Database: DatabaseDuoIcon,
} as const satisfies Record<string, DashboardShortcutIcon>;

export type DashboardShortcutIconName = keyof typeof DASHBOARD_SHORTCUT_ICONS;

export const DEFAULT_DASHBOARD_SHORTCUT_ICON = BoxDuoIcon;

export const DASHBOARD_SHORTCUT_ICON_NAMES = Object.keys(
  DASHBOARD_SHORTCUT_ICONS,
) as DashboardShortcutIconName[];

export function isDashboardShortcutIconName(
  name: string,
): name is DashboardShortcutIconName {
  return name in DASHBOARD_SHORTCUT_ICONS;
}

/** Resolves an env/config icon name; unknown names fall back to Box. */
export function resolveDashboardShortcutIcon(
  name?: DashboardShortcutIconName | string,
): DashboardShortcutIcon {
  if (name && isDashboardShortcutIconName(name)) {
    return DASHBOARD_SHORTCUT_ICONS[name];
  }
  return DEFAULT_DASHBOARD_SHORTCUT_ICON;
}

export interface CustomDashboardLink {
  title: string;
  description: string;
  href: string;
  icon?: DashboardShortcutIconName;
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
 * @returns Processed dashboard links ready for rendering
 */
export function processCustomDashboardLinks(
  links: CustomDashboardLink[],
  context: DashboardLinkContext,
): Array<{
  title: string;
  description: string;
  href: string;
  icon: DashboardShortcutIcon;
  visible: boolean;
}> {
  return links
    .map((link) => ({
      ...link,
      // Only replace placeholders in href, keep title and description as-is
      href: replacePlaceholders(link.href, context),
      icon: resolveDashboardShortcutIcon(link.icon),
      visible: link.visible !== false, // Default to true unless explicitly false
    }))
    .filter((link) => link.visible);
}
