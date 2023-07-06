import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import { PrimaryParametersPlot } from "./Consultations/PrimaryParametersPlot";
export default function ConsultationSummaryTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <PageTitle
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
    </PageTitle>
  );
}
