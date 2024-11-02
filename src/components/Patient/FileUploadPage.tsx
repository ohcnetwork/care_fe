import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import Page from "@/components/Common/components/Page";
import { FileUpload } from "../Files/FileUpload";

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
