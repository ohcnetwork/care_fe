import Page from "@/components/Common/Page";
import { FileUpload } from "@/components/Files/FileUpload";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export default function FileUploadPage(props: {
  facilityId: string;
  patientId: string;
  consultationId?: string;
  type: "CONSULTATION" | "PATIENT";
}) {
  const { facilityId, patientId, consultationId, type } = props;

  const { data: patient } = useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    prefetch: !!patientId,
  });

  return (
    <Page
      hideBack={false}
      title="Patient Files"
      crumbsReplacements={{
        [facilityId]: { name: patient?.facility_object?.name },
        [patientId]: { name: patient?.name },
      }}
      backUrl={
        type === "CONSULTATION"
          ? `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
          : `/facility/${facilityId}/patient/${patientId}`
      }
    >
      <FileUpload
        patientId={patientId}
        consultationId={consultationId}
        type={type}
        allowAudio={true}
      />
    </Page>
  );
}
