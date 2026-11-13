import * as React from "react";

import { getTagColorStyles } from "@/components/Tags/tagColor";

import {
  TagConfig,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
