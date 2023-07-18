import { ConsultationTabProps } from "../../Common/constants";
import { PressureSoreDiagrams } from "./Consultations/PressureSoreDiagrams";
import Page from "../Common/components/Page";

export default function ConsultationPressureSoreTab({
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page
      className="mt-4"
      title="Pressure Sore"
      hideBack={true}
      breadcrumbs={false}
    >
      <PressureSoreDiagrams consultationId={consultationId} />
    </Page>
  );
}
