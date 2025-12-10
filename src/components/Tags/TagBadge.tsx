import * as React from "react";

import {
  TagConfig,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function getTagColorStyles(tag: TagConfig) {
  const color = tag.meta?.color; // hex color string or undefined
  if (!color || typeof color !== "string") return {};

  return {
    color,
    backgroundColor: color + "40", // add 40% opacity to the color
    borderColor: color + "60", // add 60% opacity to the color
  };
}

interface TagBadgeProps extends Omit<
  React.ComponentProps<typeof Badge>,
  "children"
> {
  tag: TagConfig;
  className?: string;
  hierarchyDisplay?: boolean;
}

export default function TagBadge({
  tag,
  className,
  hierarchyDisplay = false,
  variant = "secondary",
  ...props
}: TagBadgeProps) {
  return (
    <Badge
      title={tag.description}
      variant={variant}
      style={{
        ...getTagColorStyles(tag),
      }}
      className={cn("capitalize", className)}
      {...props}
    >
      {hierarchyDisplay ? getTagHierarchyDisplay(tag) : tag.display}
    </Badge>
  );
}
