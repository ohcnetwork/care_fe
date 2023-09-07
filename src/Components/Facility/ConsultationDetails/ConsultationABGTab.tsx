import { lazy } from "react";
import { ABGPlots } from "../Consultations/ABGPlots";
import { ConsultationTabProps } from "./index";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export default function ConsultationABGTab(props: ConsultationTabProps) {
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
}
