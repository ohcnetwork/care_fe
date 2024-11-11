import PageTitle from "@/components/Common/PageTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import { PressureSoreDiagrams } from "@/components/Facility/Consultations/PressureSoreDiagrams";

export const ConsultationPressureSoreTab = (props: ConsultationTabProps) => {
  return (
    <div className="mt-4">
      <PageTitle title="Pressure Sore" hideBack={true} breadcrumbs={false} />
      <PressureSoreDiagrams consultationId={props.consultationId} />
    </div>
  );
};
