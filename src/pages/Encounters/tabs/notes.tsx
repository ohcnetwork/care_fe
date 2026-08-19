import { NoteManager } from "@/components/Notes/NoteManager";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const EncounterNotesTab = () => {
  const {
    selectedEncounterId: encounterId,
    selectedEncounter,
    canWriteSelectedEncounter,
    canReadClinicalData,
    patientId,
  } = useEncounter();
  const { hasPermission } = usePermissions();
  const { canWriteEncounterClinicalData } = getPermissions(
    hasPermission,
    selectedEncounter?.permissions ?? [],
  );

  const canAccess = canReadClinicalData;
  const canWrite =
    canAccess && canWriteSelectedEncounter && canWriteEncounterClinicalData;

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
