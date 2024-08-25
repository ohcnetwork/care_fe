import { lazy } from "react";
import { ConsultationTabProps } from "./index";
import { PrimaryParametersPlot } from "../Consultations/PrimaryParametersPlot";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationSummaryTab = (props: ConsultationTabProps) => {
  return (
    <div className="mt-4">
      <PageTitle
        title="Primary Parameters Plot"
        hideBack={true}
        breadcrumbs={false}
      />
      <PrimaryParametersPlot
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
      />
    </div>
  );
};
