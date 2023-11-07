import { lazy } from "react";

import { ConsultationTabProps } from "@/Components/Facility/ConsultationDetails/index";
import { Feed } from "@/Components/Facility/Consultations/Feed";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationFeedTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <PageTitle
        title="Camera Feed"
        breadcrumbs={false}
        hideBack={true}
        focusOnLoad={true}
      />
      <Feed
        facilityId={props.facilityId}
        consultationId={props.consultationId}
      />
    </div>
  );
};
