import QuestionnaireResponseView from "@/components/Facility/ConsultationDetails/QuestionnaireResponseView";
import EncounterQuestionnaire from "@/components/Patient/EncounterQuestionnaire";
import FileUploadPage from "@/components/Patient/FileUploadPage";

import { AppRoutes } from "@/Routers/AppRouter";
import { EncounterShow } from "@/pages/Encounters/EncounterShow";
import { PrintPrescription } from "@/pages/Encounters/PrintPrescription";

const consultationRoutes: AppRoutes = {
  "/facility/:facilityId/encounter/:encounterId/prescriptions/print": ({
    facilityId,
    encounterId,
  }) => <PrintPrescription facilityId={facilityId} encounterId={encounterId} />,
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
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire/:slug":
    ({ facilityId, encounterId, slug, patientId }) => (
      <EncounterQuestionnaire
        facilityId={facilityId}
        encounterId={encounterId}
        questionnaireSlug={slug}
        patientId={patientId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire_response/:id":
    ({ patientId, id }) => (
      <QuestionnaireResponseView responseId={id} patientId={patientId} />
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
};

export default consultationRoutes;
