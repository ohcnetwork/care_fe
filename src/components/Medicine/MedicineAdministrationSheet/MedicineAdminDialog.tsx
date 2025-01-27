"use client";

import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEncounter } from "@/components/Facility/ConsultationDetails/EncounterContext";

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
  administrationRequest: MedicationAdministrationRequest;
}

export const MedicineAdminDialog = ({
  open,
  onOpenChange,
  medication,
  lastAdministeredDate,
  administrationRequest: initialRequest,
}: Props) => {
  const { patient } = useEncounter();
  const [administrationRequest, setAdministrationRequest] =
    React.useState<MedicationAdministrationRequest>(initialRequest);

  // Update state when initialRequest changes
  React.useEffect(() => {
    setAdministrationRequest(initialRequest);
  }, [initialRequest]);

  const { mutate: upsertAdministration, isPending } = useMutation({
    mutationFn: mutate(
      medicationAdministrationApi.upsertMedicationAdministration,
    ),
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    upsertAdministration({
      pathParams: { patientId: patient!.id },
      data: [administrationRequest], // Send as single-item array for upsert
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {administrationRequest.id
                ? "Edit Administration"
                : "Administer Medicine"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          <MedicineAdminForm
            medication={medication}
            lastAdministeredDate={lastAdministeredDate}
            administrationRequest={administrationRequest}
            onChange={setAdministrationRequest}
            formId="single"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? "Saving..."
              : administrationRequest.id
                ? "Update"
                : "Administer Medicine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
