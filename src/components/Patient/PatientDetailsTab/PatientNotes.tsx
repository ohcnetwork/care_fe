import { NoteManager } from "@/components/Notes/NoteManager";

import { PatientProps } from ".";

export const PatientNotesTab = (props: PatientProps) => {
  return (
    <NoteManager
      canAccess={true}
      canWrite={true}
      patientId={props.patientData.id}
      encounterId={undefined}
    />
  );
};
