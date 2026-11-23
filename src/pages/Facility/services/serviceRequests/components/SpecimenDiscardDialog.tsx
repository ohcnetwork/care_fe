import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  SPECIMEN_DISCARD_REASONS,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";

interface SpecimenDiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDiscarding: boolean;
  onDiscard: (status: SpecimenStatus) => void;
}

export function SpecimenDiscardDialog({
  open,
  onOpenChange,
  isDiscarding,
  onDiscard,
}: SpecimenDiscardDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<SpecimenStatus | null>(null);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {/* The dialog's gap already spaces the reasons from the header. */}
        <AlertDialogHeader className="pb-0 md:pb-0">
          <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("specimen_discard_dialog_description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RadioGroup<SpecimenStatus>
          value={reason ?? ""}
          onValueChange={setReason}
          aria-label={t("specimen_discard_dialog_description")}
          className="gap-2 px-4 md:px-6"
        >
          {SPECIMEN_DISCARD_REASONS.map((option) => (
            <FieldLabel key={option.status} htmlFor={option.status}>
              <Field orientation="horizontal">
                <RadioGroupItem value={option.status} id={option.status} />
                <FieldContent>
                  <FieldTitle>{option.label}</FieldTitle>
                  <FieldDescription>{option.description}</FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDiscarding}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => reason && onDiscard(reason)}
            disabled={isDiscarding || !reason}
          >
            {isDiscarding ? t("discarding") : t("discard")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
