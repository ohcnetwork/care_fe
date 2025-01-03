import MedicineAdministrationSheet from "@/components/Medicine/MedicineAdministrationSheet";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterMedicinesTab = (props: EncounterTabProps) => {
  return (
    <div className="flex flex-col gap-16">
      <MedicineAdministrationSheet facilityId={props.facilityId} />
    </div>
  );
};
