import { ConsultationTabProps } from "../../Common/constants";
import Page from "../Common/components/Page";
import { DialysisPlots } from "./Consultations/DialysisPlots";
export default function ConsultationDialysisTab({
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page title="Dialysis Plots" hideBack={true} breadcrumbs={false}>
      <DialysisPlots consultationId={consultationId}></DialysisPlots>
    </Page>
  );
}
