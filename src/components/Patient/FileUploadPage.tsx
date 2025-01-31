import Page from "@/components/Common/Page";
import { FileUpload } from "@/components/Files/FileUpload";

export default function FileUploadPage(props: {
  facilityId: string;
  patientId: string;
  encounterId?: string;
  type: "encounter" | "patient";
}) {
  const { facilityId, patientId, encounterId, type } = props;
  return (
    <Page
      hideBack={false}
      title="Patient Files"
      backUrl={
        type === "encounter"
          ? `/facility/${facilityId}/encounter/${encounterId}`
          : `/facility/${facilityId}/patient/${patientId}`
      }
    >
      <FileUpload
        patientId={patientId}
        encounterId={encounterId}
        type={type}
        allowAudio={true}
      />
    </Page>
  );
}
