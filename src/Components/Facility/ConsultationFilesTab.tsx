import { FileUpload } from "../Patient/FileUpload";
import { ConsultationTabProps } from "../../Common/constants";

export default function ConsultationFilesTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <div>
      <FileUpload
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        type="CONSULTATION"
        hideBack={true}
        audio={true}
        unspecified={true}
      />
    </div>
  );
}
