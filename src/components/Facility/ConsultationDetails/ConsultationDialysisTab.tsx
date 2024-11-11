import PageTitle from "@/components/Common/PageTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import { DialysisPlots } from "@/components/Facility/Consultations/DialysisPlots";

export const ConsultationDialysisTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle title="Dialysis Plots" hideBack={true} breadcrumbs={false} />
      <DialysisPlots consultationId={props.consultationId} />
    </div>
  );
};
