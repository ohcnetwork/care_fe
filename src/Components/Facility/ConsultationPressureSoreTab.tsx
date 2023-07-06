import { ConsultationTabProps } from "../../Common/constants";
import { PressureSoreDiagrams } from "./Consultations/PressureSoreDiagrams";
import PageTitle from "../Common/PageTitle";

export default function ConsultationPressureSoreTab({
  consultationId,
}: ConsultationTabProps) {
  return (
    <PageTitle
      className="mt-4"
      title="Pressure Sore"
      hideBack={true}
      breadcrumbs={false}
    >
      <PressureSoreDiagrams consultationId={consultationId} />
    </PageTitle>
  );
}
