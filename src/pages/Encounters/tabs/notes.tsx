import { NoteManager } from "@/components/Notes/NoteManager";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

// Main component
export const EncounterNotesTab = () => {
  const {
    selectedEncounterId: encounterId,
    canWriteSelectedEncounter,
    canAccessSelectedEncounter,
    patientId,
  } = useEncounter();

  return (
    <div>
      <NoteManager
        canAccess={canAccessSelectedEncounter}
        canWrite={canWriteSelectedEncounter}
        encounterId={encounterId}
        patientId={patientId}
      />
    </div>
  );
};
