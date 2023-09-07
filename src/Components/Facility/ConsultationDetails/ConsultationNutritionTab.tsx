import { lazy } from "react";
import { NutritionPlots } from "../Consultations/NutritionPlots";
import { ConsultationTabProps } from "./index";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export default function ConsultationNutritionTab(props: ConsultationTabProps) {
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
}
