import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import { NutritionPlots } from "./Consultations/NutritionPlots";
export default function ConsultationNutritionTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <PageTitle title="Nutrition" hideBack={true} breadcrumbs={false}>
      <NutritionPlots
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></NutritionPlots>
    </PageTitle>
  );
}
