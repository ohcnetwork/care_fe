import { lazy } from "react";

import { ConsultationTabProps } from "@/Components/Facility/ConsultationDetails/index";
import { DialysisPlots } from "@/Components/Facility/Consultations/DialysisPlots";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationDialysisTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle title="Dialysis Plots" hideBack={true} breadcrumbs={false} />
      <DialysisPlots consultationId={props.consultationId}></DialysisPlots>
    </div>
  );
};
