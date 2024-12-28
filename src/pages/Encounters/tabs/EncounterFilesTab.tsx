import { FileUpload } from "@/components/Files/FileUpload";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterFilesTab = (props: EncounterTabProps) => {
  return (
    <FileUpload
      patientId={props.patient.id}
      encounterId={props.encounter.id}
      type="encounter"
      allowAudio
    />
  );
};
