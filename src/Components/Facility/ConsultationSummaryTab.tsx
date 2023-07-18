import { ConsultationTabProps } from "../../Common/constants";
import Page from "../Common/components/Page";
import { PrimaryParametersPlot } from "./Consultations/PrimaryParametersPlot";
export default function ConsultationSummaryTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <Page
      className="mt-4"
      title="Primary Parameters Plot"
      hideBack={true}
      breadcrumbs={false}
    >
      {" "}
      <PrimaryParametersPlot
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></PrimaryParametersPlot>
    </Page>
  );
}
