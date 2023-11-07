import { lazy } from "react";

import { ConsultationTabProps } from "@/Components/Facility/ConsultationDetails/index";
import { NursingPlot } from "@/Components/Facility/Consultations/NursingPlot";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationNursingTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle title="Nursing Analysis" hideBack={true} breadcrumbs={false} />
      <NursingPlot
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
      ></NursingPlot>
    </div>
  );
};
