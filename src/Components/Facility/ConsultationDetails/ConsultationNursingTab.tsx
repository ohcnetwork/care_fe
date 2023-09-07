import { lazy } from "react";
import { NursingPlot } from "../Consultations/NursingPlot";
import { ConsultationTabProps } from "./index";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export default function ConsultationNursingTab(props: ConsultationTabProps) {
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
}
