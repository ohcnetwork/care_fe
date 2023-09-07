import { lazy } from "react";
import { VentilatorPlot } from "../Consultations/VentilatorPlot";
import { ConsultationTabProps } from "./index";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export default function ConsultationVentilatorTab(props: ConsultationTabProps) {
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
}
