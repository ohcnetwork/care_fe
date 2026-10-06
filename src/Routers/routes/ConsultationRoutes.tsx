import { lazy } from "react";

import type { AppRoutes } from "@/Routers/AppRouter";
import type { AdministrableProductType } from "@/types/inventory/productKnowledge/productKnowledge";

const PrintAllQuestionnaireResponses = lazy(() =>
  import("@/components/Facility/ConsultationDetails/PrintAllQuestionnaireResponses").then(
    (module) => ({ default: module.PrintAllQuestionnaireResponses }),
  ),
);
const PrintQuestionnaireResponse = lazy(() =>
  import("@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse").then(
    (module) => ({ default: module.PrintQuestionnaireResponse }),
  ),
);
const QuestionnaireResponseView = lazy(
  () =>
    import("@/components/Facility/ConsultationDetails/QuestionnaireResponseView"),
);
const PrintMedicationAdministration = lazy(() =>
  import("@/components/Medicine/MedicationAdministration/PrintMedicationAdministration").then(
    (module) => ({ default: module.PrintMedicationAdministration }),
  ),
);
const EncounterQuestionnaire = lazy(
  () => import("@/components/Patient/EncounterQuestionnaire"),
);
const EncounterShow = lazy(() =>
  import("@/pages/Encounters/EncounterShow").then((module) => ({
    default: module.EncounterShow,
  })),
);
const PrintPrescription = lazy(() =>
  import("@/pages/Encounters/PrintPrescription").then((module) => ({
    default: module.PrintPrescription,
  })),
);
const ReportViewer = lazy(() => import("@/pages/Encounters/ReportViewer"));
const EncounterProvider = lazy(() =>
  import("@/pages/Encounters/utils/EncounterProvider").then((module) => ({
    default: module.EncounterProvider,
  })),
);

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
      <EncounterQuestionnaire
        facilityId={facilityId}
        encounterId={encounterId}
        patientId={patientId}
        subjectType="encounter"
      />
    ),

  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/questionnaire/:slug":
    ({ facilityId, encounterId, slug, patientId }) => (
      <EncounterQuestionnaire
        facilityId={facilityId}
        encounterId={encounterId}
        questionnaireSlug={slug}
        patientId={patientId}
        subjectType="encounter"
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
  "/facility/:facilityId/patient/:patientId/consultation": ({
    facilityId,
    patientId,
  }) => (
    <EncounterQuestionnaire
      facilityId={facilityId}
      patientId={patientId}
      questionnaireSlug="encounter"
      subjectType="encounter"
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
  "/patient/:patientId/questionnaire": ({ patientId }) => (
    <EncounterQuestionnaire patientId={patientId} subjectType="patient" />
  ),
};

export default consultationRoutes;
