import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { PatientIdentifierSelector } from "@/components/Patient/PatientIdentifierSelector";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import {
  PartialPatientModel,
  PatientListRead,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";

interface CreateDispenseSheetProps {
  facilityId: string;
  locationId: string;
  trigger?: React.ReactNode;
  patientId?: string;
}

export function CreateDispenseSheet({
  facilityId,
  trigger,
  patientId,
}: CreateDispenseSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<
    PatientListRead | PartialPatientModel | null
  >(null);

  // Fetch patient data when patientId is provided
  const { data: preselectedPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientId! },
    }),
    enabled: !!patientId,
  });

  // Direct navigation handler when patient is preselected
  const handleDirectDispense = () => {
    if (!preselectedPatient) return;
    navigate(
      `/facility/${facilityId}/patients/verify?${new URLSearchParams({
        phone_number: preselectedPatient.phone_number,
        year_of_birth: preselectedPatient.year_of_birth?.toString() || "",
        partial_id: preselectedPatient.id.slice(0, 5),
        flow: "dispense",
      }).toString()}`,
    );
  };

  const resetState = () => {
    setSelectedPatient(null);
  };

  useShortcutSubContext("facility:pharmacy");

  const handlePatientSelect = useCallback(
    (patient: PatientListRead | PartialPatientModel) => {
      setSelectedPatient(patient);
    },
    [],
  );

  const handleClearPatient = useCallback(() => {
    setSelectedPatient(null);
  }, []);

  const handleRegisterNewPatient = useCallback(() => {
    setIsOpen(false);
    resetState();
    navigate(`/facility/${facilityId}/patient/create`, {
      query: { flow: "dispense" },
    });
  }, [facilityId]);

  const handleProceedToDispense = () => {
    if (!selectedPatient) {
      toast.error(t("select_patient_first"));
      return;
    }
    setIsOpen(false);
    resetState();
    navigate(
      `/facility/${facilityId}/patients/verify?${new URLSearchParams({
        phone_number: selectedPatient.phone_number,
        year_of_birth:
          ("year_of_birth" in selectedPatient &&
            selectedPatient.year_of_birth?.toString()) ||
          "",
        partial_id: selectedPatient.id.slice(0, 5),
        flow: "dispense",
      }).toString()}`,
    );
  };

  // When patientId is provided, render a simple button that navigates directly
  if (patientId && preselectedPatient) {
    const triggerElement = trigger || (
      <Button>
        <Plus className="size-4 mr-1" />
        {t("new_dispense")}
      </Button>
    );

    return (
      <span onClick={handleDirectDispense} className="cursor-pointer">
        {triggerElement}
      </span>
    );
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetState();
      }}
    >
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="size-4 mr-1" />
            {t("new_dispense")}
            <ShortcutBadge actionId="dispense-button" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("new_dispense")}</SheetTitle>
          <SheetDescription>
            {selectedPatient
              ? t("dispense_for_patient", {
                  patientName: selectedPatient.name,
                })
              : t("select_patient_to_dispense")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <PatientIdentifierSelector
            facilityId={facilityId}
            selectedPatient={selectedPatient}
            onPatientSelect={handlePatientSelect}
            onClearPatient={handleClearPatient}
            onRegisterNewPatient={handleRegisterNewPatient}
          />

          {selectedPatient && (
            <SheetFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleProceedToDispense}>
                {t("proceed_to_dispense")}
              </Button>
            </SheetFooter>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
