import { ConsultationTabProps } from "./index";
import { VentilatorPlot } from "../Consultations/VentilatorPlot";

import PageTitle from "@/components/Common/PageTitle";

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
      />
    </div>
  );
};
