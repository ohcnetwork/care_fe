import PageTitle from "@/components/Common/PageTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import { PrimaryParametersPlot } from "@/components/Facility/Consultations/PrimaryParametersPlot";

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
