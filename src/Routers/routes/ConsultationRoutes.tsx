import { ConsultationDetails } from "@/components/Facility/ConsultationDetails";
import ConsultationDoctorNotes from "@/components/Facility/ConsultationDoctorNotes";
import { ConsultationForm } from "@/components/Facility/ConsultationForm";
import Investigation from "@/components/Facility/Investigations";
import InvestigationPrintPreview from "@/components/Facility/Investigations/InvestigationsPrintPreview";
import ShowInvestigation from "@/components/Facility/Investigations/ShowInvestigation";
import TreatmentSummary from "@/components/Facility/TreatmentSummary";
import CriticalCareEditor from "@/components/LogUpdate/CriticalCareEditor";
import CriticalCarePreview from "@/components/LogUpdate/CriticalCarePreview";
import ManagePrescriptions from "@/components/Medicine/ManagePrescriptions";
import PrescriptionsPrintPreview from "@/components/Medicine/PrintPreview";
import { DailyRoundListDetails } from "@/components/Patient/DailyRoundListDetails";
import { DailyRounds } from "@/components/Patient/DailyRounds";
import FileUploadPage from "@/components/Patient/FileUploadPage";
import PatientConsentRecords from "@/components/Patient/PatientConsentRecords";

import { AppRoutes } from "@/Routers/AppRouter";

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
  "/facility/:facilityId/patient/:patientId/consultation/:id/investigation/:sessionId/print":
    ({ facilityId, patientId, id, sessionId }: any) => (
      <InvestigationPrintPreview
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
