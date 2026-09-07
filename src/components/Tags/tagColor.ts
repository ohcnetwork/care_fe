import type { CSSProperties } from "react";

import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

/**
 * Reads the admin-assigned color (hex string) from a tag's metadata, if any.
 */
export function getTagColor(tag: TagConfig): string | undefined {
  const color = tag.metadata?.color;
  return typeof color === "string" && color ? color : undefined;
}

/**
 * Inline styles for a tag badge, tinted with the tag's assigned color.
 * Returns an empty object when the tag has no color so the badge keeps its
 * default variant styling.
 */
export function getTagColorStyles(tag: TagConfig): CSSProperties {
  const color = getTagColor(tag);
  if (!color) return {};

  return {
    color,
    backgroundColor: color + "40", // add 40% opacity to the color
    borderColor: color + "60", // add 60% opacity to the color
  };
}
