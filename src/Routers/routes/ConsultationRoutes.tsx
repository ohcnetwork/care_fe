import { Suspense, lazy } from "react";

import Loading from "@/components/Common/Loading";
import QuestionnaireResponseView from "@/components/Facility/ConsultationDetails/QuestionnaireResponseView";
import { PrintMedicationAdministration } from "@/components/Medicine/MedicationAdministration/PrintMedicationAdministration";
import EncounterQuestionnaire from "@/components/Patient/EncounterQuestionnaire";
import TreatmentSummary from "@/components/Patient/TreatmentSummary";

import { AppRoutes } from "@/Routers/AppRouter";
import { EncounterShow } from "@/pages/Encounters/EncounterShow";
import { PrintPrescription } from "@/pages/Encounters/PrintPrescription";

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
        <EncounterShow
          patientId={patientId}
          encounterId={encounterId}
          tab={tab}
          facilityId={identifier === "facility" ? id : undefined}
        />
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
