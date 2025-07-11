import { NoteManager } from "@/components/Notes/NoteManager";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { inactiveEncounterStatus } from "@/types/emr/encounter/encounter";

// Main component
export const EncounterNotesTab = () => {
  const {
    patientPermissions: { canViewClinicalData },
    selectedEncounterPermissions: { canViewEncounter, canWriteEncounter },
    selectedEncounterId: encounterId,
    selectedEncounter: encounter,
    currentEncounterId,
    patientId,
  } = useEncounter();
  const canAccess = canViewClinicalData || canViewEncounter;
  const inactiveEncounter = !!(
    encounter && inactiveEncounterStatus.includes(encounter.status)
  );
  const canWrite =
    canWriteEncounter &&
    !inactiveEncounter &&
    encounterId === currentEncounterId;

  return (
    <div>
      <NoteManager
        canAccess={canAccess}
        canWrite={canWrite}
        encounterId={encounterId}
        patientId={patientId}
      />
    </div>
  );
};
