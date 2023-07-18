import { FileUpload } from "../Patient/FileUpload";
import { ConsultationTabProps } from "../../Common/constants";
import Page from "../Common/components/Page";
export default function ConsultationFilesTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page title="Files">
      <FileUpload
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        type="CONSULTATION"
        hideBack={true}
        audio={true}
        unspecified={true}
      />
    </Page>
  );
}
