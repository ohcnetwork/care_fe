import { ConsultationTabProps } from "../../Common/constants";
import { NursingPlot } from "./Consultations/NursingPlot";
import Page from "../Common/components/Page";

export default function ConsultationNursingTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page title="Nursing Analysis" hideBack={true} breadcrumbs={false}>
      <NursingPlot
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></NursingPlot>
    </Page>
  );
}
