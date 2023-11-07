import { lazy } from "react";

import { ConsultationTabProps } from "@/Components/Facility/ConsultationDetails/index";
import { ABGPlots } from "@/Components/Facility/Consultations/ABGPlots";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationABGTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle
        title="ABG Analysis Plot"
        hideBack={true}
        breadcrumbs={false}
      />
      <ABGPlots
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
      ></ABGPlots>
    </div>
  );
};
