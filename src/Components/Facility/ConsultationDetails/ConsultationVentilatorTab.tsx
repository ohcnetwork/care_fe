import { lazy } from "react";

import { ConsultationTabProps } from "@/Components/Facility/ConsultationDetails/index";
import { VentilatorPlot } from "@/Components/Facility/Consultations/VentilatorPlot";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationVentilatorTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle
        title="Respiratory Support"
        hideBack={true}
        breadcrumbs={false}
      />
      <VentilatorPlot
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
      ></VentilatorPlot>
    </div>
  );
};
