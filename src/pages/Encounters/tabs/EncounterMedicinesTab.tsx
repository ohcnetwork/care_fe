import MedicineAdministrationSheet from "@/components/Medicine/MedicineAdministrationSheet";
import { MedicinePrescriptionSummary } from "@/components/Medicine/MedicinePrescriptionSummary";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterMedicinesTab = (props: EncounterTabProps) => {
  const isDischarged = props.encounter.status_history.history.some(
    ({ status }) => status === "DISCHARGED",
  );
  return (
    <div className="flex flex-col gap-16">
      <MedicineAdministrationSheet readonly={isDischarged} is_prn={false} />
      <MedicineAdministrationSheet is_prn={true} readonly={isDischarged} />
      <MedicinePrescriptionSummary consultation={props.encounter.id} />
    </div>
  );
};
