import { Redirect } from "raviger";
import { Suspense, lazy } from "react";

import Loading from "@/components/Common/Loading";
import { patientTabs } from "@/components/Patient/PatientDetailsTab";
import { PatientHome } from "@/components/Patient/PatientHome";
import PatientIndex from "@/components/Patient/PatientIndex";
import PatientRegistration from "@/components/Patient/PatientRegistration";

import { AppRoutes } from "@/Routers/AppRouter";
import { ConsentDetailPage } from "@/pages/Encounters/ConsentDetail";
import EncountersOverview from "@/pages/Encounters/EncountersOverview";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";
import ClinicalHistoryPage from "@/pages/Patient/History";
import VerifyPatient from "@/pages/Patients/VerifyPatient";
import careConfig from "@careConfig";

const ExcalidrawEditor = lazy(
  () => import("@/components/Common/Drawings/ExcalidrawEditor"),
);

const PatientRoutes: AppRoutes = {
  "/facility/:facilityId/patients": ({ facilityId }) => (
    <PatientIndex facilityId={facilityId} />
  ),
  "/facility/:facilityId/encounters": ({ facilityId }) => (
    <Redirect
      to={`/facility/${facilityId}/encounters/patients/${
        careConfig.defaultEncounterType || "all"
      }`}
    />
  ),
  "/facility/:facilityId/encounters/patients": ({ facilityId }) => (
    <Redirect
      to={`/facility/${facilityId}/encounters/patients/${
        careConfig.defaultEncounterType || "all"
      }`}
    />
  ),
  "/facility/:facilityId/encounters/patients/all": ({ facilityId }) => (
    <EncountersOverview facilityId={facilityId} />
  ),
  "/facility/:facilityId/encounters/patients/:encounterClass": ({
    facilityId,
    encounterClass,
  }) => (
    <EncountersOverview
      facilityId={facilityId}
      encounterClass={encounterClass}
    />
  ),

  "/facility/:facilityId/encounters/:tab": ({ facilityId, tab }) => (
    <EncountersOverview facilityId={facilityId} tab={tab} />
  ),
  "/facility/:facilityId/encounters/locations/:locationId": ({
    facilityId,
    locationId,
  }) => (
    <EncountersOverview
      facilityId={facilityId}
      tab="locations"
      locationId={locationId}
    />
  ),
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/consents/:consentId":
    ({ facilityId, patientId, encounterId, consentId }) => (
      <EncounterProvider
        encounterId={encounterId}
        patientId={patientId}
        facilityId={facilityId}
      >
        <ConsentDetailPage consentId={consentId} />
      </EncounterProvider>
    ),
  "/facility/:facilityId/patients/verify": () => <VerifyPatient />,
  "/patient/:id": ({ id }) => <PatientHome id={id} page="demography" />,
  "/patient/:id/update": ({ id }) => <PatientRegistration patientId={id} />,
  ...patientTabs.reduce((acc: AppRoutes, tab) => {
    acc["/patient/:id/" + tab.route] = ({ id }) => (
      <PatientHome id={id} page={tab.route} />
    );
    return acc;
  }, {}),
  "/facility/:facilityId/patient/create": ({ facilityId }) => (
    <PatientRegistration facilityId={facilityId} />
  ),
  "/facility/:facilityId/patient/:id": ({ facilityId, id }) => (
    <PatientHome facilityId={facilityId} id={id} page="demography" />
  ),
  ...patientTabs.reduce((acc: AppRoutes, tab) => {
    acc["/facility/:facilityId/patient/:id/" + tab.route] = ({
      facilityId,
      id,
    }) => <PatientHome facilityId={facilityId} id={id} page={tab.route} />;
    return acc;
  }, {}),
  "/facility/:facilityId/patient/:id/update": ({ facilityId, id }) => (
    <PatientRegistration facilityId={facilityId} patientId={id} />
  ),
  "/facility/:facilityId/patient/:patientId/drawings/new": ({ patientId }) => {
    return (
      <Suspense fallback={<Loading />}>
        <ExcalidrawEditor
          associatingId={patientId}
          associating_type="patient"
        />
      </Suspense>
    );
  },
  "/facility/:facilityId/patient/:patientId/drawings/:drawingId": ({
    patientId,
    drawingId,
  }) => (
    <Suspense fallback={<Loading />}>
      <ExcalidrawEditor
        associatingId={patientId}
        associating_type="patient"
        drawingId={drawingId}
      />
    </Suspense>
  ),

  "/patient/:patientId/drawings/new": ({ patientId }) => {
    return (
      <Suspense fallback={<Loading />}>
        <ExcalidrawEditor
          associatingId={patientId}
          associating_type="patient"
        />
      </Suspense>
    );
  },
  "/patient/:patientId/drawings/:drawingId": ({ patientId, drawingId }) => (
    <Suspense fallback={<Loading />}>
      <ExcalidrawEditor
        associatingId={patientId}
        associating_type="patient"
        drawingId={drawingId}
      />
    </Suspense>
  ),
  "/facility/:facilityId/patient/:patientId/history/:tab": ({
    facilityId,
    patientId,
    tab,
  }) => (
    <ClinicalHistoryPage
      patientId={patientId}
      tab={tab}
      fallBackUrl={`/facility/${facilityId}/patient/${patientId}`}
    />
  ),
  "/patient/:patientId/history/:tab": ({ patientId, tab }) => (
    <ClinicalHistoryPage
      patientId={patientId}
      tab={tab}
      fallBackUrl={`/patient/${patientId}`}
    />
  ),
};

export default PatientRoutes;
