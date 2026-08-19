import { NoteManager } from "@/components/Notes/NoteManager";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import { PatientProps } from ".";

export const PatientNotesTab = (props: PatientProps) => {
  const { hasPermission } = usePermissions();
  const { canViewClinicalData, canWritePatient } = getPermissions(
    hasPermission,
    props.patientData.permissions,
  );

  return (
    <div className="w-full flex flex-col h-[calc(100vh-18rem)] border border-r mt-1 md:mt-4 rounded-lg overflow-hidden">
      <NoteManager
        canAccess={canViewClinicalData}
        canWrite={canViewClinicalData && canWritePatient}
        patientId={props.patientData.id}
        encounterId={undefined}
        hideEncounterNotes={true}
      />
    </div>
  );
};
