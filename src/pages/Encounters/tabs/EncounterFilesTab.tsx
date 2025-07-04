import { FilesTab } from "@/components/Files/FilesTab";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const EncounterFilesTab = () => {
  const { currentEncounter, patient, facilityId } = useEncounter();

  return (
    <FilesTab
      type="encounter"
      encounter={currentEncounter}
      patient={patient}
      facilityId={facilityId}
    />
  );
};
