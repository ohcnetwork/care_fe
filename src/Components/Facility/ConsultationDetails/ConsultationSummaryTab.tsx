import { lazy } from "react";
import { PrimaryParametersPlot } from "../Consultations/PrimaryParametersPlot";
import { ConsultationTabProps } from "./index";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export default function ConsultationSummaryTab(props: ConsultationTabProps) {
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
      ></PrimaryParametersPlot>
    </div>
  );
}
