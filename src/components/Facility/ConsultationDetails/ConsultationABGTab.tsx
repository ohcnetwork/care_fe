import PageTitle from "@/components/Common/PageTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import { ABGPlots } from "@/components/Facility/Consultations/ABGPlots";

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
