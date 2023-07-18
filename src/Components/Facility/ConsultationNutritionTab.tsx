import { ConsultationTabProps } from "../../Common/constants";
import Page from "../Common/components/Page";
import { NutritionPlots } from "./Consultations/NutritionPlots";
export default function ConsultationNutritionTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page title="Nutrition" hideBack={true} breadcrumbs={false}>
      <NutritionPlots
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></NutritionPlots>
    </Page>
  );
}
