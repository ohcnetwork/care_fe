import { getTagColor } from "@/components/Tags/tagColor";

import { cn } from "@/lib/utils";

import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

interface TagColorDotProps {
  tag: TagConfig;
  /**
   * Tailwind bg/border classes used when the tag has no assigned color
   * (preserves the existing palette-based look).
   */
  fallbackColorClass?: string;
  className?: string;
}

/**
 * Small round color swatch shown next to a tag's name in selectors and lists.
 * Uses the tag's assigned metadata color when present, otherwise falls back to
 * the provided palette class.
 */
export default function TagColorDot({
  tag,
  fallbackColorClass,
  className,
}: TagColorDotProps) {
  const color = getTagColor(tag);

  return (
    <div
      className={cn(
        "h-3 w-3 rounded-full shrink-0 border",
        !color && fallbackColorClass,
        className,
      )}
      style={color ? { backgroundColor: color, borderColor: color } : undefined}
    />
  );
}
