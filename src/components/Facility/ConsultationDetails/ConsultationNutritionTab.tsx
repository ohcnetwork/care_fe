import PageTitle from "@/components/Common/PageTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import { NutritionPlots } from "@/components/Facility/Consultations/NutritionPlots";

export const ConsultationNutritionTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle title="Nutrition" hideBack={true} breadcrumbs={false} />
      <NutritionPlots
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
      />
    </div>
  );
};
