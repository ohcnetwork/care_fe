import { FilesTab } from "@/components/Files/FilesTab";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const EncounterFilesTab = () => {
  const {
    selectedEncounter: encounter,
    patient,
    currentEncounterId,
  } = useEncounter();

  const readOnly = encounter?.id !== currentEncounterId;

  return (
    <FilesTab
      type="encounter"
      encounter={encounter}
      patient={patient}
      readOnly={readOnly}
    />
  );
};
