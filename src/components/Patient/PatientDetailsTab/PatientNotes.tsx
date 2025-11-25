import { NoteManager } from "@/components/Notes/NoteManager";

import { PatientProps } from ".";

export const PatientNotesTab = (props: PatientProps) => {
  return (
    <div className="w-full flex flex-col h-[calc(100vh-18rem)] border border-r mt-1 md:mt-4 rounded-lg overflow-hidden">
      <NoteManager
        canAccess={true}
        canWrite={true}
        patientId={props.patientData.id}
        encounterId={undefined}
        hideEncounterNotes={true}
      />
    </div>
  );
};
