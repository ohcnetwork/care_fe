import { lazy } from "react";
import { Feed } from "../Consultations/Feed";
import { ConsultationTabProps } from "./index";
import PatientPrivacyToggle from "../../Patient/PatientPrivacyToggle";
const Page = lazy(() => import("../../Common/components/Page"));

export const ConsultationFeedTab = (props: ConsultationTabProps) => {
  return (
    <Page
      title="Camera Feed"
      breadcrumbs={false}
      hideBack={true}
      focusOnLoad={true}
      className="px-0"
      options={
        <PatientPrivacyToggle
          consultationId={props.consultationId}
          consultation={props.consultationData}
          // fetchPatientData={props.patientData}
        />
      }
    >
      <Feed
        facilityId={props.facilityId}
        consultationId={props.consultationId}
      />
    </Page>
  );
};
