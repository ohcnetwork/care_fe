import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import { ABGPlots } from "./Consultations/ABGPlots";
export default function ConsultationABGTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <PageTitle title="ABG Analysis Plot" hideBack={true} breadcrumbs={false}>
      <ABGPlots
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></ABGPlots>
    </PageTitle>
  );
}
