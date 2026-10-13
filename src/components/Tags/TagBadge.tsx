import type { ComponentProps } from "react";

import { TagExpiry } from "@/components/Tags/TagExpiry";
import { getTagColorStyles } from "@/components/Tags/tagColor";

import {
  TagConfig,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagBadgeProps extends Omit<ComponentProps<typeof Badge>, "children"> {
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
      {(tag.expiry || tag.expired === true) && (
        <TagExpiry
          key={`${tag.expiry ?? ""}:${tag.expired === true}`}
          expiry={tag.expiry}
          expired={tag.expired === true}
        />
      )}
    </Badge>
  );
}
