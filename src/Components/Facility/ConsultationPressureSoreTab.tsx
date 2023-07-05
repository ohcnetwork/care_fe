import { ConsultationTabProps } from "../../Common/constants";
import { PressureSoreDiagrams } from "./Consultations/PressureSoreDiagrams";
import PageTitle from "../Common/PageTitle";

export default function ConsultationPressureSoreTab({
  consultationId,
}: ConsultationTabProps) {
  return (
    <div className="mt-4">
      <PageTitle title="Pressure Sore" hideBack={true} breadcrumbs={false} />
      <PressureSoreDiagrams consultationId={consultationId} />
    </div>
  );
}
