import { ConsultationTabProps } from "./index";
import { NutritionPlots } from "../Consultations/NutritionPlots";

import PageTitle from "@/Components/Common/PageTitle";

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
