import { Clock } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { getTagColorStyles } from "@/components/Tags/tagColor";
import { useTagExpiry } from "@/components/Tags/useTagExpiry";

import {
  TagConfig,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/Utils/utils";

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
  const { t } = useTranslation();
  const { expiry, expired } = useTagExpiry(tag);

  const title = [
    tag.description,
    expiry &&
      t(expired ? "tag_expired_at" : "tag_expires_at", {
        date: formatDateTime(expiry),
      }),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Badge
      title={title || undefined}
      variant={variant}
      style={{
        ...getTagColorStyles(tag),
      }}
      className={cn(
        "capitalize",
        expired && "line-through opacity-60",
        className,
      )}
      {...props}
    >
      {expiry && <Clock data-icon="inline-start" aria-hidden />}
      {hierarchyDisplay ? getTagHierarchyDisplay(tag) : tag.display}
    </Badge>
  );
}
