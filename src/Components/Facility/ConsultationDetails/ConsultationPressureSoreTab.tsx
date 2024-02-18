import { lazy } from "react";
import { ConsultationTabProps } from "./index";
import { PressureSoreDiagrams } from "../Consultations/PressureSoreDiagrams";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationPressureSoreTab = (props: ConsultationTabProps) => {
  return (
    <div className="mt-4">
      <PageTitle title="Pressure Sore" hideBack={true} breadcrumbs={false} />
      <PressureSoreDiagrams consultationId={props.consultationId} />
    </div>
  );
};
