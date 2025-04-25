import MedicationRequestTable from "@/components/Medicine/MedicationRequestTable";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterMedicinesTab = (props: EncounterTabProps) => {
  return (
    <div className="flex flex-col gap-16">
      <MedicationRequestTable
        patient={props.patient}
        encounter={props.encounter}
      />
    </div>
  );
};
