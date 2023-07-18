import { ConsultationTabProps } from "../../Common/constants";
import Page from "../Common/components/Page";
import { ABGPlots } from "./Consultations/ABGPlots";
export default function ConsultationABGTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page title="ABG Analysis Plot" hideBack={true} breadcrumbs={false}>
      <ABGPlots
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></ABGPlots>
    </Page>
  );
}
