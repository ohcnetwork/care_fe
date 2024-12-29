import QuestionnaireResponseView from "@/components/Facility/ConsultationDetails/QuestionnaireResponseView";
import ConsultationDoctorNotes from "@/components/Facility/ConsultationDoctorNotes";
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
import EncounterQuestionnaire from "@/components/Patient/EncounterQuestionnaire";
import FileUploadPage from "@/components/Patient/FileUploadPage";
import PatientConsentRecords from "@/components/Patient/PatientConsentRecords";

import { AppRoutes } from "@/Routers/AppRouter";
import { EncounterShow } from "@/pages/Encounters/EncounterShow";

const consultationRoutes: AppRoutes = {
  "/facility/:facilityId/encounter/:encounterId/:tab": ({
    facilityId,
    encounterId,
    tab,
  }) => (
    <EncounterShow
      facilityId={facilityId}
      encounterId={encounterId}
      tab={tab}
    />
  ),
  "/facility/:facilityId/patient/:patientId/consultation": ({
    facilityId,
    patientId,
  }) => (
    <EncounterQuestionnaire
      facilityId={facilityId}
      patientId={patientId}
      questionnaireSlug="encounter"
    />
  ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/edit_encounter":
    ({ facilityId, encounterId, patientId }) => (
      <EncounterQuestionnaire
        facilityId={facilityId}
        encounterId={encounterId}
        questionnaireSlug="encounter"
        patientId={patientId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:id/consent-records":
    ({ facilityId, patientId, id }) => (
      <PatientConsentRecords
        facilityId={facilityId}
        patientId={patientId}
        consultationId={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/encounterId/:id/files/": ({
    facilityId,
    patientId,
    id,
  }) => (
    <FileUploadPage
      facilityId={facilityId}
      patientId={patientId}
      encounterId={id}
      type="encounter"
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
  "/facility/:facilityId/patient/:patientId/consultation/:id/log_updates": ({
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
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/log_updates/:id/update":
    ({ facilityId, patientId, consultationId, id }) => (
      <DailyRounds
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/log_updates/:id":
    ({ facilityId, patientId, consultationId, id }) => (
      <DailyRoundListDetails
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/log_updates/:id/critical_care":
    ({ facilityId, patientId, consultationId, id }) => (
      <CriticalCarePreview
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
    ),
  "/facility/:facilityId/patient/:patientId/consultation/:consultationId/log_updates/:id/critical_care/update":
    ({ facilityId, patientId, consultationId, id }) => (
      <CriticalCareEditor
        facilityId={facilityId}
        patientId={patientId}
        consultationId={consultationId}
        id={id}
      />
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
  "/facility/:facilityId/patient/:patientId/questionnaire": ({
    facilityId,
    patientId,
  }) => (
    <EncounterQuestionnaire
      facilityId={facilityId}
      patientId={patientId}
      subjectType="patient"
    />
  ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire":
    ({ facilityId, encounterId, patientId }) => (
      <EncounterQuestionnaire
        facilityId={facilityId}
        encounterId={encounterId}
        patientId={patientId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire_response/:id":
    ({ patientId, id }) => (
      <QuestionnaireResponseView responseId={id} patientId={patientId} />
    ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire/:slug":
    ({ facilityId, encounterId, slug, patientId }) => (
      <EncounterQuestionnaire
        facilityId={facilityId}
        encounterId={encounterId}
        questionnaireSlug={slug}
        patientId={patientId}
      />
    ),
};

export default consultationRoutes;
