import { ConsultationTabProps } from "./index";
import { FileUpload } from "../../Patient/FileUpload";

export const ConsultationFilesTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <FileUpload
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
        type="CONSULTATION"
        hideBack={true}
        audio={true}
        unspecified={true}
      />
    </div>
  );
};
