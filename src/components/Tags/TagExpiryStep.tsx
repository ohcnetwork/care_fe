import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TagExpiryOffsetInput } from "@/components/Tags/TagExpiryOffsetInput";
import {
  compactExpiryOffset,
  formatExpiryOffset,
  hasExpiryOffset,
} from "@/components/Tags/tagExpiry";

import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";

import { TagConfig, TagExpiryOffset } from "@/types/emr/tagConfig/tagConfig";

interface TagExpiryStepProps {
  tag: TagConfig;
  onBack: () => void;
  onApply: (expiryOffset?: TagExpiryOffset) => void;
}

/**
 * Lets the user pick an expiry while applying a tag whose config allows it.
 * Leaving the duration empty falls back to the config's default expiry, if any.
 */
export function TagExpiryStep({ tag, onBack, onApply }: TagExpiryStepProps) {
  const { t } = useTranslation();
  const { autoset_expiry, expiry_offset } = tag.expiry_metadata ?? {};
  const defaultOffset = autoset_expiry ? expiry_offset : undefined;
  const [offset, setOffset] = useState<TagExpiryOffset>(defaultOffset ?? {});
  const containerRef = useRef<HTMLDivElement>(null);

  // The menu refocuses its popup after the picked item is hidden, which wins
  // over autoFocus, so move focus to the first input once that has settled.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      containerRef.current?.querySelector("input")?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    // Keep typing and Tab inside the inputs instead of the menu's typeahead.
    <div
      ref={containerRef}
      className="flex flex-col gap-4 p-3"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onBack}
          aria-label={t("back")}
        >
          <ArrowLeft />
        </Button>
        <span className="truncate text-sm font-medium">
          {t("set_tag_expiry", { tag: tag.display })}
        </span>
      </div>
      <FieldGroup className="gap-2">
        <TagExpiryOffsetInput value={offset} onChange={setOffset} />
        <FieldDescription>
          {defaultOffset
            ? t("tag_expiry_default", {
                duration: formatExpiryOffset(defaultOffset, t),
              })
            : t("tag_expiry_leave_empty")}
        </FieldDescription>
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          {t("cancel")}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onApply(
              hasExpiryOffset(offset) ? compactExpiryOffset(offset) : undefined,
            )
          }
        >
          {t("apply_tag")}
        </Button>
      </div>
    </div>
  );
}
