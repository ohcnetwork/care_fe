import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import { VentilatorPlot } from "./Consultations/VentilatorPlot";
export default function ConsultationVentilatorTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <div>
      <PageTitle
        title="Respiratory Support"
        hideBack={true}
        breadcrumbs={false}
      />
      <VentilatorPlot
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></VentilatorPlot>
    </div>
  );
}
