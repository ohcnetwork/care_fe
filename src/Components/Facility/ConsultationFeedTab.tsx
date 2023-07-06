import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import { Feed } from "./Consultations/Feed";
export default function ConsultationFeedTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <PageTitle
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
    </PageTitle>
  );
}
