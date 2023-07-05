import PageTitle from "../Common/PageTitle";
import { ConsultationTabProps } from "../../Common/constants";
import { NursingPlot } from "./Consultations/NursingPlot";

export default function ConsultationNursingTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <div>
      <PageTitle title="Nursing Analysis" hideBack={true} breadcrumbs={false} />
      <NursingPlot
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></NursingPlot>
    </div>
  );
}
