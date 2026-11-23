import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatTimeUntil } from "@/components/Tags/tagExpiry";
import { useTagExpiry } from "@/components/Tags/useTagExpiry";

import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

interface TagExpiryLabelProps {
  tag: TagConfig;
}

/** Compact "in 3 days" / "Expired" label for a tag set with an expiry. */
export function TagExpiryLabel({ tag }: TagExpiryLabelProps) {
  const { t, i18n } = useTranslation();
  const { expiry, expired } = useTagExpiry(tag);
  if (!expiry) return null;

  return (
    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
      <Clock className="size-3" aria-hidden />
      {expired ? t("expired") : formatTimeUntil(expiry, i18n.language)}
    </span>
  );
}
