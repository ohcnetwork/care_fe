import MedicationRequestTable from "@/components/Medicine/MedicationRequestTable";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterMedicinesTab = (props: EncounterTabProps) => {
  return (
    <div className="flex flex-col gap-16">
      <MedicationRequestTable
        patientId={props.patient.id}
        encounter={props.encounter}
      />
    </div>
  );
};
