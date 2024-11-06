import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import { FileUpload } from "@/components/Files/FileUpload";

export const ConsultationFilesTab = (props: ConsultationTabProps) => {
  return (
    <div className="p-4">
      <FileUpload
        patientId={props.patientId}
        consultationId={props.consultationId}
        type="CONSULTATION"
        allowAudio
      />
    </div>
  );
};
