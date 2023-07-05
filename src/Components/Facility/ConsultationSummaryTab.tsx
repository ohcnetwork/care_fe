import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import { PrimaryParametersPlot } from "./Consultations/PrimaryParametersPlot";
export default function ConsultationSummaryTab({
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  return (
    <div className="mt-4">
      <PageTitle
        title="Primary Parameters Plot"
        hideBack={true}
        breadcrumbs={false}
      />
      <PrimaryParametersPlot
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      ></PrimaryParametersPlot>
    </div>
  );
}
