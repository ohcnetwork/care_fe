import { lazy } from "react";
import { Feed } from "../Consultations/Feed";
import { ConsultationTabProps } from "./index";

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
