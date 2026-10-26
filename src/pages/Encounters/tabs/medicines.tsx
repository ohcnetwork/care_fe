import MedicationRequestTable, {
  type MedicationRequestTab,
} from "@/components/Medicine/MedicationRequestTable";

export const EncounterMedicinesTab = ({
  returnPage,
  tabs,
  defaultTab,
}: {
  returnPage?: string;
  tabs?: MedicationRequestTab[];
  defaultTab?: MedicationRequestTab;
} = {}) => {
  return (
    <MedicationRequestTable
      returnPage={returnPage}
      tabs={tabs}
      defaultTab={defaultTab}
    />
  );
};
