import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { TagConfig, TagExpiryOffset } from "@/types/emr/tagConfig/tagConfig";

const EXPIRY_UNITS = ["days", "hours", "minutes", "seconds"] as const;

interface TagExpiryDialogProps {
  tag: TagConfig;
  onApply: (offset?: TagExpiryOffset) => void;
  onCancel: () => void;
}

export function TagExpiryDialog({
  tag,
  onApply,
  onCancel,
}: TagExpiryDialogProps) {
  const { t } = useTranslation();
  const id = useId();
  const [customExpiry, setCustomExpiry] = useState(false);
  const [offset, setOffset] = useState(
    Object.fromEntries(
      EXPIRY_UNITS.map((unit) => [
        unit,
        String(tag.expiry_metadata?.expiry_offset?.[unit] ?? 0),
      ]),
    ),
  );
  const [error, setError] = useState<string>();

  const handleApply = () => {
    if (!customExpiry) {
      onApply();
      return;
    }

    const values = EXPIRY_UNITS.map((unit) => Number(offset[unit]));
    if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) {
      setError(t("tag_expiry_duration_non_negative_integer"));
      return;
    }
    if (!values.some((value) => value > 0)) {
      setError(t("tag_expiry_duration_positive"));
      return;
    }
    onApply(
      Object.fromEntries(EXPIRY_UNITS.map((unit, i) => [unit, values[i]])),
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tag_expiry_configuration")}</DialogTitle>
          <DialogDescription>
            {t("tag_assignment_expiry_hint")}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium">{tag.display}</p>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${id}-custom`}
            checked={customExpiry}
            onCheckedChange={(checked) => {
              setCustomExpiry(checked === true);
              setError(undefined);
            }}
          />
          <Label htmlFor={`${id}-custom`}>{t("tag_set_custom_expiry")}</Label>
        </div>
        {customExpiry && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              {t("tag_expiry_duration")}
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {EXPIRY_UNITS.map((unit) => (
                <div key={unit} className="space-y-1">
                  <Label htmlFor={`${id}-${unit}`}>{t(unit)}</Label>
                  <Input
                    id={`${id}-${unit}`}
                    type="number"
                    min={0}
                    step={1}
                    value={offset[unit]}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(event) => {
                      setOffset((previous) => ({
                        ...previous,
                        [unit]: event.target.value,
                      }));
                      setError(undefined);
                    }}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button onClick={handleApply}>{t("tag_apply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
