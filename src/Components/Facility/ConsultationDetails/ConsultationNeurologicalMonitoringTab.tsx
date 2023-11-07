import { lazy } from "react";

import { ConsultationTabProps } from "@/Components/Facility/ConsultationDetails/index";
import { NeurologicalTable } from "@/Components/Facility/Consultations/NeurologicalTables";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationNeurologicalMonitoringTab = (
  props: ConsultationTabProps
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
      ></NeurologicalTable>
    </div>
  );
};
