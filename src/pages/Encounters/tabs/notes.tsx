import { NoteManager } from "@/components/Notes/NoteManager";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

// Main component
export const EncounterNotesTab = () => {
  const {
    selectedEncounterId: encounterId,
    canWriteSelectedEncounter,
    canReadSelectedEncounter,
    patientId,
  } = useEncounter();

  return (
    <div>
      <NoteManager
        canAccess={canReadSelectedEncounter}
        canWrite={canWriteSelectedEncounter}
        encounterId={encounterId}
        patientId={patientId}
      />
    </div>
  );
};
