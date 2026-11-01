import { Clock } from "lucide-react";
import * as React from "react";
import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";

import { getTagColorStyles } from "@/components/Tags/tagColor";
import { getTagExpiry, isTagExpired } from "@/components/Tags/tagExpiry";

import {
  TagConfig,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import dayjs from "@/Utils/dayjs";
import { formatDateTime } from "@/Utils/utils";

// setTimeout overflows past this delay; such tags update on the next refetch
const MAX_TIMER_MS = 2 ** 31 - 1;

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
  const expiry = getTagExpiry(tag);
  const expired = isTagExpired(tag);
  const [, rerender] = useReducer((count: number) => count + 1, 0);

  // Re-render once the tag expires so it isn't still shown as active.
  useEffect(() => {
    const msLeft = getTagExpiry(tag)?.diff(dayjs());
    if (!msLeft || msLeft <= 0 || msLeft > MAX_TIMER_MS) return;
    const timer = setTimeout(rerender, msLeft + 1000);
    return () => clearTimeout(timer);
  }, [tag]);

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
