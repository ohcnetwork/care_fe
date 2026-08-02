import { PrintAllQuestionnaireResponses } from "@/components/Facility/ConsultationDetails/PrintAllQuestionnaireResponses";
import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";
import QuestionnaireResponseView from "@/components/Facility/ConsultationDetails/QuestionnaireResponseView";
import { PrintMedicationAdministration } from "@/components/Medicine/MedicationAdministration/PrintMedicationAdministration";
import QuestionnaireFillPage from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import { AppRoutes } from "@/Routers/AppRouter";
import { EncounterShow } from "@/pages/Encounters/EncounterShow";
import { PrintPrescription } from "@/pages/Encounters/PrintPrescription";
import ReportViewer from "@/pages/Encounters/ReportViewer";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

import type { AdministrableProductType } from "@/types/inventory/productKnowledge/productKnowledge";

const consultationRoutes: AppRoutes = {
  "/facility/:facilityId/patient/:patientId/prescription/:prescriptionId/print":
    ({ facilityId, patientId, prescriptionId }) => (
      <PrintPrescription
        facilityId={facilityId}
        patientId={patientId}
        prescriptionId={prescriptionId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/prescriptions/print":
    ({ facilityId, patientId, encounterId }) => (
      <PrintPrescription
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      />
    ),
  ...[
    "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire/:questionnaireId/responses/print",
    "/organization/:organizationId/patient/:patientId/encounter/:encounterId/questionnaire/:questionnaireId/responses/print",
    "/facility/:facilityId/patient/:patientId/questionnaire/:questionnaireId/responses/print",
    "/organization/:organizationId/patient/:patientId/questionnaire/:questionnaireId/responses/print",
    "/patient/:patientId/questionnaire/:questionnaireId/responses/print",
    "/facility/:facilityId/patient/:patientId/history/questionnaire/:questionnaireId/responses/print",
    "/patient/:patientId/history/questionnaire/:questionnaireId/responses/print",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({ encounterId, patientId, questionnaireId, facilityId }) => {
      return (
        <PrintAllQuestionnaireResponses
          encounterId={encounterId}
          patientId={patientId}
          questionnaireId={questionnaireId}
          facilityId={facilityId}
        />
      );
    };
    return acc;
  }, {}),
  ...[
    "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire_response/:questionnaireResponseId/print",
    "/facility/:facilityId/patient/:patientId/history/questionnaire_response/:questionnaireResponseId/print",
    "/patient/:patientId/history/questionnaire_response/:questionnaireResponseId/print",
    "/organization/:organizationId/patient/:patientId/encounter/:encounterId/questionnaire_response/:questionnaireResponseId/print",
    "/facility/:facilityId/patient/:patientId/questionnaire_response/:questionnaireResponseId/print",
    "/organization/:organizationId/patient/:patientId/questionnaire_response/:questionnaireResponseId/print",
    "/patient/:patientId/questionnaire_response/:questionnaireResponseId/print",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({
      encounterId,
      patientId,
      questionnaireResponseId,
      facilityId,
    }) => {
      return (
        <PrintQuestionnaireResponse
          encounterId={encounterId}
          patientId={patientId}
          questionnaireResponseId={questionnaireResponseId}
          facilityId={facilityId}
        />
      );
    };
    return acc;
  }, {}),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/type/:productType/administrations/print":
    ({ facilityId, encounterId, patientId, productType }) => (
      <PrintMedicationAdministration
        facilityId={facilityId}
        encounterId={encounterId}
        patientId={patientId}
        productType={productType as AdministrableProductType}
      />
    ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/report/template/:templateSlug":
    ({ encounterId, templateSlug }) => (
      <ReportViewer encounterId={encounterId} templateSlug={templateSlug} />
    ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/report/:reportId":
    ({ encounterId, reportId }) => (
      <ReportViewer encounterId={encounterId} reportId={reportId} />
    ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire":
    ({ facilityId, encounterId, patientId }) => (
      <QuestionnaireFillPage
        subject={{ type: "encounter", facilityId, patientId, encounterId }}
      />
    ),

  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire/:questionnaireId":
    ({ facilityId, encounterId, questionnaireId, patientId }) => (
      <QuestionnaireFillPage
        subject={{ type: "encounter", facilityId, patientId, encounterId }}
        questionnaireId={questionnaireId}
      />
    ),

  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire_response/:id":
    ({ patientId, id }) => (
      <QuestionnaireResponseView responseId={id} patientId={patientId} />
    ),
  ...["facility", "organization"].reduce((acc: AppRoutes, identifier) => {
    acc[`/${identifier}/:id/patient/:patientId/encounter/:encounterId/:tab`] =
      ({ id, encounterId, tab, patientId }) => (
        <EncounterProvider
          encounterId={encounterId}
          patientId={patientId}
          facilityId={identifier === "facility" ? id : undefined}
        >
          <EncounterShow tab={tab} />
        </EncounterProvider>
      );
    return acc;
  }, {}),
  // Encounter CREATION: there is no encounter yet, so the subject is the
  // patient; the fixed "encounter" questionnaire is what makes one.
  "/facility/:facilityId/patient/:patientId/consultation": ({
    facilityId,
    patientId,
  }) => (
    <QuestionnaireFillPage
      subject={{ type: "patient", facilityId, patientId }}
      questionnaireId="encounter"
    />
  ),
  "/facility/:facilityId/patient/:patientId/questionnaire": ({
    facilityId,
    patientId,
  }) => (
    <QuestionnaireFillPage
      subject={{ type: "patient", facilityId, patientId }}
    />
  ),
  // The patient-subject picker needs an id route to land on — the legacy
  // form appended picked questionnaires in-session instead of navigating,
  // so these two shapes are new alongside the v2 single-questionnaire fill.
  "/facility/:facilityId/patient/:patientId/questionnaire/:questionnaireId": ({
    facilityId,
    patientId,
    questionnaireId,
  }) => (
    <QuestionnaireFillPage
      subject={{ type: "patient", facilityId, patientId }}
      questionnaireId={questionnaireId}
    />
  ),
  "/patient/:patientId/questionnaire": ({ patientId }) => (
    <QuestionnaireFillPage subject={{ type: "patient", patientId }} />
  ),
  "/patient/:patientId/questionnaire/:questionnaireId": ({
    patientId,
    questionnaireId,
  }) => (
    <QuestionnaireFillPage
      subject={{ type: "patient", patientId }}
      questionnaireId={questionnaireId}
    />
  ),
};

export default consultationRoutes;
