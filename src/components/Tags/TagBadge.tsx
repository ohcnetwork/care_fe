import { Clock } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { getTagColorStyles } from "@/components/Tags/tagColor";
import { formatTimeUntil } from "@/components/Tags/tagExpiry";
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
  const { t, i18n } = useTranslation();
  const { expiry, expired } = useTagExpiry(tag);

  const expiryText =
    expiry &&
    t(expired ? "tag_expired_at" : "tag_expires_at", {
      date: formatDateTime(expiry),
    });
  const title = [tag.description, expiryText].filter(Boolean).join("\n");

  return (
    <Badge
      title={title || undefined}
      variant={variant}
      style={{
        ...getTagColorStyles(tag),
      }}
      className={cn("capitalize", expired && "opacity-60", className)}
      {...props}
    >
      {expiry && <Clock data-icon="inline-start" aria-hidden />}
      <span className={cn(expired && "line-through")}>
        {hierarchyDisplay ? getTagHierarchyDisplay(tag) : tag.display}
      </span>
      {expiry && (
        // Shown on the badge so keyboard and touch users see it without the
        // title tooltip; the full date is read out by screen readers.
        <>
          <span aria-hidden className="font-normal normal-case opacity-75">
            {expired
              ? t("expired")
              : formatTimeUntil(expiry, i18n.language, "narrow")}
          </span>
          <span className="sr-only normal-case">{expiryText}</span>
        </>
      )}
    </Badge>
  );
}
