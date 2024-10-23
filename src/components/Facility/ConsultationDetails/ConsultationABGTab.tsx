import { ConsultationTabProps } from "./index";
import { ABGPlots } from "../Consultations/ABGPlots";

import PageTitle from "@/components/Common/PageTitle";

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
      />
    </div>
  );
};
