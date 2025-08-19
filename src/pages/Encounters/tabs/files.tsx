import { FilesTab } from "@/components/Files/FilesTab";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { FileType } from "@/types/files/file";

export const EncounterFilesTab = () => {
  const {
    selectedEncounter: encounter,
    patient,
    canWriteSelectedEncounter,
  } = useEncounter();

  return (
    <FilesTab
      type={FileType.ENCOUNTER}
      encounter={encounter}
      patient={patient}
      readOnly={!canWriteSelectedEncounter}
    />
  );
};
