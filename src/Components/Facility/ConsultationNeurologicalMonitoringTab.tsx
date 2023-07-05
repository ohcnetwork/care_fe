import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import { NeurologicalTable } from "./Consultations/NeurologicalTables";
export default function ConsultationNeurologicalMonitoringTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <div>
      <PageTitle
        title="Neurological Monitoring"
        hideBack={true}
        breadcrumbs={false}
      />
      <NeurologicalTable
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></NeurologicalTable>
    </div>
  );
}
