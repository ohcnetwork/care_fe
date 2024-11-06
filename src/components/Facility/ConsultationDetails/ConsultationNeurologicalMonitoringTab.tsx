import PageTitle from "@/components/Common/PageTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import { NeurologicalTable } from "@/components/Facility/Consultations/NeurologicalTables";

export const ConsultationNeurologicalMonitoringTab = (
  props: ConsultationTabProps,
) => {
  return (
    <div>
      <PageTitle
        title="Neurological Monitoring"
        hideBack={true}
        breadcrumbs={false}
      />
      <NeurologicalTable
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
      />
    </div>
  );
};
