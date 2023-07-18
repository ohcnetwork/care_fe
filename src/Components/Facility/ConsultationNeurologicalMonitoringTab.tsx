import { ConsultationTabProps } from "../../Common/constants";
import Page from "../Common/components/Page";
import { NeurologicalTable } from "./Consultations/NeurologicalTables";
export default function ConsultationNeurologicalMonitoringTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page title="Neurological Monitoring" hideBack={true} breadcrumbs={false}>
      <NeurologicalTable
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></NeurologicalTable>
    </Page>
  );
}
