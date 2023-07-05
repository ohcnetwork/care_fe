import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import { DialysisPlots } from "./Consultations/DialysisPlots";
export default function ConsultationDialysisTab({
  consultationId,
}: ConsultationTabProps) {
  return (
    <div>
      <PageTitle title="Dialysis Plots" hideBack={true} breadcrumbs={false} />
      <DialysisPlots consultationId={consultationId}></DialysisPlots>
    </div>
  );
}
