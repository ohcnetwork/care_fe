import { ConsultationForm } from "../../Components/Facility/ConsultationForm";
import Investigation from "../../Components/Facility/Investigations";
import ShowInvestigation from "../../Components/Facility/Investigations/ShowInvestigation";
import ManagePrescriptions from "../../Components/Medicine/ManagePrescriptions";
import { DailyRoundListDetails } from "../../Components/Patient/DailyRoundListDetails";
import { DailyRounds } from "../../Components/Patient/DailyRounds";
import { ConsultationDetails } from "../../Components/Facility/ConsultationDetails";
import TreatmentSummary from "../../Components/Facility/TreatmentSummary";
import ConsultationDoctorNotes from "../../Components/Facility/ConsultationDoctorNotes";
import PatientConsentRecords from "../../Components/Patient/PatientConsentRecords";
import CriticalCareEditor from "../../Components/LogUpdate/CriticalCareEditor";
import PrescriptionsPrintPreview from "../../Components/Medicine/PrintPreview";
import CriticalCarePreview from "../../Components/LogUpdate/CriticalCarePreview";
import FileUploadPage from "../../Components/Patient/FileUploadPage";
import { AppRoutes } from "../AppRouter";

const consultationRoutes: AppRoutes = {
  "/facility/:facilityId/patient/:patientId/consultation": ({
    facilityId,
    patientId,
  }) => <ConsultationForm facilityId={facilityId} patientId={patientId} />,
  "/facility/:facilityId/patient/:patientId/consultation/:id/update": ({
    facilityId,
    patientId,
    id,
  }) => (
    <ConsultationForm facilityId={facilityId} patientId={patientId} id={id} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/consent-records":
    ({ facilityId, patientId, id }) => (
      <PatientConsentRecords
        facilityId={facilityId}
        patientId={patientId}
        consultationId={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/files/": ({
    facilityId,
    patientId,
    id,
  }) => (
    <FileUploadPage
      facilityId={facilityId}
      patientId={patientId}
      consultationId={id}
      type="CONSULTATION"
    />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/prescriptions":
    (path) => <ManagePrescriptions {...path} />,
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/prescriptions/print":
    () => <PrescriptionsPrintPreview />,
  "/facility/:facilityId/patient/:patientId/consultation/:id/investigation": ({
    facilityId,
    patientId,
    id,
  }) => (
    <Investigation
      consultationId={id}
      facilityId={facilityId}
      patientId={patientId}
    />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/investigation/:sessionId":
    ({ facilityId, patientId, id, sessionId }) => (
      <ShowInvestigation
        consultationId={id}
        facilityId={facilityId}
        patientId={patientId}
        sessionId={sessionId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/daily-rounds": ({
    facilityId,
    patientId,
    id,
  }) => (
    <DailyRounds
      facilityId={facilityId}
      patientId={patientId}
      consultationId={id}
    />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily-rounds/:id/update":
    ({ facilityId, patientId, consultationId, id }) => (
      <DailyRounds
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily-rounds/:id":
    ({ facilityId, patientId, consultationId, id }) => (
      <DailyRoundListDetails
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily_rounds/:id":
    ({ facilityId, patientId, consultationId, id }) => (
      <CriticalCarePreview
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/daily_rounds/:id/update":
    ({ facilityId, patientId, consultationId, id }) => (
      <CriticalCareEditor
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId": ({
    facilityId,
    patientId,
    consultationId,
  }) => (
    <ConsultationDetails
      facilityId={facilityId}
      patientId={patientId}
      consultationId={consultationId}
      tab={"updates"}
    />
  ),
  "/consultation/:consultationId": ({ consultationId }) => (
    <ConsultationDetails consultationId={consultationId} tab={"updates"} />
  ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/treatment-summary":
    ({ facilityId, patientId, consultationId }) => (
      <TreatmentSummary
        facilityId={facilityId}
        consultationId={consultationId}
        patientId={patientId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/notes":
    ({ facilityId, patientId, consultationId }) => (
      <ConsultationDoctorNotes
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/:tab":
    ({ facilityId, patientId, consultationId, tab }) => (
      <ConsultationDetails
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        tab={tab}
      />
    ),
};

export default consultationRoutes;
