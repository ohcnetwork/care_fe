import { ConsultationTabProps } from "../../Common/constants";
import Page from "../Common/components/Page";
import { Feed } from "./Consultations/Feed";
export default function ConsultationFeedTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page
      title="Camera Feed"
      breadcrumbs={false}
      hideBack={true}
      focusOnLoad={true}
    >
      <Feed
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      />
    </Page>
  );
}
