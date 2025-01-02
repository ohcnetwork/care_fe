import MedicineAdministrationSheet from "@/components/Medicine/MedicineAdministrationSheet";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterMedicinesTab = (props: EncounterTabProps) => {
  const isDischarged = props.encounter.status_history.history.some(
    ({ status }) => status === "DISCHARGED",
  );
  return (
    <div className="flex flex-col gap-16">
      <MedicineAdministrationSheet
        readonly={isDischarged}
        isPrn={false}
        facilityId={props.facilityId}
      />
      <MedicineAdministrationSheet
        isPrn={true}
        readonly={isDischarged}
        facilityId={props.facilityId}
      />
      {/* <MedicinePrescriptionSummary consultation={props.encounter.id} /> */}
    </div>
  );
};
