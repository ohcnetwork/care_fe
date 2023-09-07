import { lazy } from "react";
import { PressureSoreDiagrams } from "../Consultations/PressureSoreDiagrams";
import { ConsultationTabProps } from "./index";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export default function ConsultationPressureSoreTab(
  props: ConsultationTabProps
) {
  return (
    <div className="mt-4">
      <PageTitle title="Pressure Sore" hideBack={true} breadcrumbs={false} />
      <PressureSoreDiagrams consultationId={props.consultationId} />
    </div>
  );
}
