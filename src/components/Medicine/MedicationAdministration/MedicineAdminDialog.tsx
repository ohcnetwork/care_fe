import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const [administrationRequest, setAdministrationRequest] =
    React.useState<MedicationAdministrationRequest>(initialRequest);
  const [isFormValid, setIsFormValid] = React.useState(true);

  // Update state when initialRequest changes
  React.useEffect(() => {
    setAdministrationRequest(initialRequest);
  }, [initialRequest]);

  const { mutate: upsertAdministration, isPending } = useMutation({
    mutationFn: mutate(medicationAdministrationApi.upsert, {
      pathParams: { patientId: patientId },
    }),
    onSuccess: () => {
      onOpenChange(false);
      toast.success(t("medication_administration_saved"));
    },
  });

  const handleSubmit = () => {
    upsertAdministration({
      datapoints: [administrationRequest],
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
            formId="single"
            medication={medication}
            lastAdministeredDate={lastAdministeredDate}
            lastAdministeredBy={lastAdministeredBy}
            administrationRequest={administrationRequest}
            onChange={setAdministrationRequest}
            isValid={setIsFormValid}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !isFormValid}>
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
