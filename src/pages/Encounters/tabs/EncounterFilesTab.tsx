import { FileUpload } from "@/components/Files/FileUpload";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterFilesTab = (props: EncounterTabProps) => {
  return (
    <FileUpload
      patientId={props.patient.id}
      consultationId={props.encounter.id}
      type="CONSULTATION"
      allowAudio
    />
  );
};
