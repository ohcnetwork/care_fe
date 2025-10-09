import { Suspense, lazy } from "react";

import Loading from "@/components/Common/Loading";
import { PrintAllQuestionnaireResponses } from "@/components/Facility/ConsultationDetails/PrintAllQuestionnaireResponses";
import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";
import QuestionnaireResponseView from "@/components/Facility/ConsultationDetails/QuestionnaireResponseView";
import { PrintMedicationAdministration } from "@/components/Medicine/MedicationAdministration/PrintMedicationAdministration";
import EncounterQuestionnaire from "@/components/Patient/EncounterQuestionnaire";
import TreatmentSummary from "@/components/Patient/TreatmentSummary";

import { AppRoutes } from "@/Routers/AppRouter";
import { EncounterShow } from "@/pages/Encounters/EncounterShow";
import { PrintPrescription } from "@/pages/Encounters/PrintPrescription";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

const ExcalidrawEditor = lazy(
  () => import("@/components/Common/Drawings/ExcalidrawEditor"),
);

const consultationRoutes: AppRoutes = {
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/prescriptions/print":
    ({ facilityId, encounterId, patientId }) => (
      <PrintPrescription
        facilityId={facilityId}
        encounterId={encounterId}
        patientId={patientId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/prescription/:prescriptionId/print":
    ({ facilityId, patientId, prescriptionId }) => (
      <PrintPrescription
        facilityId={facilityId}
        patientId={patientId}
        prescriptionId={prescriptionId}
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
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/medicines/administrations/print":
    ({ facilityId, encounterId, patientId }) => (
      <PrintMedicationAdministration
        facilityId={facilityId}
        encounterId={encounterId}
        patientId={patientId}
      />
    ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/treatment_summary":
    ({ facilityId, encounterId, patientId }) => (
      <TreatmentSummary
        facilityId={facilityId}
        encounterId={encounterId}
        patientId={patientId}
      />
    ),
  "/organization/:organizationId/patient/:patientId/encounter/:encounterId/treatment_summary":
    ({ encounterId, patientId }) => (
      <TreatmentSummary encounterId={encounterId} patientId={patientId} />
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
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/drawings/new":
    ({ encounterId }) => (
      <Suspense fallback={<Loading />}>
        <ExcalidrawEditor
          associatingId={encounterId}
          associating_type="encounter"
        />
      </Suspense>
    ),

  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/drawings/:drawingId":
    ({ encounterId, drawingId }) => (
      <Suspense fallback={<Loading />}>
        <ExcalidrawEditor
          associatingId={encounterId}
          associating_type="encounter"
          drawingId={drawingId}
        />
      </Suspense>
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
