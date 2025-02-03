"use client";

import { useMutation } from "@tanstack/react-query";
import { t } from "i18next";
import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import mutate from "@/Utils/request/mutate";
import { MedicationAdministrationRequest } from "@/types/emr/medicationAdministration/medicationAdministration";
import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

import { MedicineAdminForm } from "./MedicineAdminForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: MedicationRequestRead;
  lastAdministeredDate?: string;
  lastAdministeredBy?: string;
  administrationRequest: MedicationAdministrationRequest;
  patientId: string;
}

export const MedicineAdminDialog = ({
  open,
  onOpenChange,
  medication,
  lastAdministeredDate,
  lastAdministeredBy,
  administrationRequest: initialRequest,
  patientId,
}: Props) => {
  const [administrationRequest, setAdministrationRequest] =
    React.useState<MedicationAdministrationRequest>(initialRequest);

  // Update state when initialRequest changes
  React.useEffect(() => {
    setAdministrationRequest(initialRequest);
  }, [initialRequest]);

  const { mutate: upsertAdministration, isPending } = useMutation({
    mutationFn: mutate(
      medicationAdministrationApi.upsertMedicationAdministration,
      {
        pathParams: { patientId: patientId },
      },
    ),
    onSuccess: () => {
      onOpenChange(false);
      toast.success(t("medication_administration_saved"));
    },
    onError: (error) => {
      toast.error(error.message || t("something_went_wrong"));
    },
  });

  const handleSubmit = () => {
    upsertAdministration({
      datapoints: [administrationRequest], // Send as single-item array for upsert
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {administrationRequest.id
                ? t("edit_administration")
                : t("administer_medicine")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <MedicineAdminForm
            medication={medication}
            lastAdministeredDate={lastAdministeredDate}
            lastAdministeredBy={lastAdministeredBy}
            administrationRequest={administrationRequest}
            onChange={setAdministrationRequest}
            formId="single"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? t("saving")
              : administrationRequest.id
                ? t("update")
                : t("administer_medicine")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
