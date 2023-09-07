import { lazy } from "react";
import { DialysisPlots } from "../Consultations/DialysisPlots";
import { ConsultationTabProps } from "./index";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export default function ConsultationDialysisTab(props: ConsultationTabProps) {
  return (
    <div>
      <PageTitle title="Dialysis Plots" hideBack={true} breadcrumbs={false} />
      <DialysisPlots consultationId={props.consultationId}></DialysisPlots>
    </div>
  );
}
