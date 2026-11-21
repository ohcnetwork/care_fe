import { HeartPulse, LucideIcon, MapPin, Stethoscope } from "lucide-react";

import { SchedulableResourceType } from "@/types/scheduling/schedule";

/**
 * Display order and icon for each schedulable resource type on the token
 * category settings pages.
 */
export const TOKEN_CATEGORY_RESOURCE_TYPES = [
  { type: SchedulableResourceType.Practitioner, icon: Stethoscope },
  { type: SchedulableResourceType.Location, icon: MapPin },
  { type: SchedulableResourceType.HealthcareService, icon: HeartPulse },
] as const satisfies readonly {
  type: SchedulableResourceType;
  icon: LucideIcon;
}[];

export const TOKEN_CATEGORY_RESOURCE_TYPE_ICONS = Object.fromEntries(
  TOKEN_CATEGORY_RESOURCE_TYPES.map(({ type, icon }) => [type, icon]),
) as Record<SchedulableResourceType, LucideIcon>;

/** Mirrors `renderTokenNumber` so previews match issued tokens. */
export function tokenNumberPreview(shorthand: string) {
  return `${shorthand.trim()}-001`;
}
