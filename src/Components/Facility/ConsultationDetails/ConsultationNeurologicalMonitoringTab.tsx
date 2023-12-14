import { lazy } from "react";
import { NeurologicalTable } from "../Consultations/NeurologicalTables";
import { ConsultationTabProps } from "./index";

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
      />
    </div>
  );
};
