import { lazy } from "react";

import { ConsultationTabProps } from "@/Components/Facility/ConsultationDetails/index";
import { NutritionPlots } from "@/Components/Facility/Consultations/NutritionPlots";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationNutritionTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle title="Nutrition" hideBack={true} breadcrumbs={false} />
      <NutritionPlots
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
      ></NutritionPlots>
    </div>
  );
};
