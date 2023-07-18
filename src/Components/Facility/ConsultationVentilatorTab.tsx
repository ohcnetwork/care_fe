import { ConsultationTabProps } from "../../Common/constants";
import Page from "../Common/components/Page";
import { VentilatorPlot } from "./Consultations/VentilatorPlot";
export default function ConsultationVentilatorTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page title="Respiratory Support" hideBack={true} breadcrumbs={false}>
      <VentilatorPlot
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></VentilatorPlot>
    </Page>
  );
}
