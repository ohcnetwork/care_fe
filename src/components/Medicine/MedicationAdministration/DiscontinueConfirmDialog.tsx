import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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
import { buttonVariants } from "@/components/ui/button";

import {
  ACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";

import { GroupedMedication } from "./utils";

interface DiscontinueConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication?: MedicationRequestRead | null;
  group?: GroupedMedication | null;
  onConfirm: () => void;
  isPending?: boolean;
}

export const DiscontinueConfirmDialog: React.FC<
  DiscontinueConfirmDialogProps
> = ({ open, onOpenChange, medication, group, onConfirm, isPending }) => {
  const { t } = useTranslation();

  // Count active requests in group
  const activeCount = group
    ? group.requests.filter((r) =>
        ACTIVE_MEDICATION_STATUSES.includes(
          r.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
        ),
      ).length
    : 0;

  const title = group
    ? t("discontinue_medication_group_title", {
        product: group.productName,
      })
    : t("discontinue_medication");

  const description = group
    ? t("discontinue_medication_group_description", {
        count: activeCount,
        product: group.productName,
      })
    : t("discontinue_medication_description", {
        medication: medication ? displayMedicationName(medication) : "",
      });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isPending ? t("discontinuing") : t("discontinue")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
