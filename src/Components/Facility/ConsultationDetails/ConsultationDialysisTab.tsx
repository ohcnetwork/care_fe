import { ConsultationTabProps } from "./index";
import { DialysisPlots } from "../Consultations/DialysisPlots";

import PageTitle from "@/components/Common/PageTitle";

export const ConsultationDialysisTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle title="Dialysis Plots" hideBack={true} breadcrumbs={false} />
      <DialysisPlots consultationId={props.consultationId} />
    </div>
  );
};
