import careConfig from "@careConfig";
import { Redirect } from "raviger";

import { AppRoutes } from "@/Routers/AppRouter";
import { lazyPage } from "@/Routers/lazyPage";

const PatientIndex = lazyPage(
  () => import("@/components/Patient/PatientIndex"),
);
const PatientProfile = lazyPage(
  () => import("@/components/Patient/PatientProfile"),
  "PatientProfile",
);
const PatientRegistration = lazyPage(
  () => import("@/components/Patient/PatientRegistration"),
  "PatientRegistration",
);
const EncountersOverview = lazyPage(
  () => import("@/pages/Encounters/EncountersOverview"),
);
const ClinicalHistoryPage = lazyPage(() => import("@/pages/Patient/History"));
const PatientHome = lazyPage(() => import("@/pages/Patient/PatientHome"));
const ConsentDetailRoute = lazyPage(
  () => import("@/Routers/pages/ConsentDetailRoute"),
  "ConsentDetailRoute",
);
const PatientProfileTabRoute = lazyPage(
  () => import("@/Routers/pages/PatientProfileTabRoute"),
  "PatientProfileTabRoute",
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
  ...[
    "/facility/:facilityId/patient/:patientId/encounter/:encounterId/consents/:consentId",
    "/organization/organizationId/patient/:patientId/encounter/:encounterId/consents/:consentId",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({ facilityId, patientId, encounterId, consentId }) => (
      <ConsentDetailRoute
        encounterId={encounterId}
        patientId={patientId}
        facilityId={facilityId}
        consentId={consentId}
      />
    );
    return acc;
  }, {}),

  "/facility/:facilityId/patients/home": () => <PatientHome />,
  "/patient/:id": ({ id }) => <PatientProfile id={id} page="demography" />,
  // Unknown tabs render the not-found page (see PatientProfileTabRoute).
  "/patient/:id/:tab": ({ id, tab }) => (
    <PatientProfileTabRoute id={id} tab={tab} />
  ),
  "/facility/:facilityId/patient/create": () => <PatientRegistration />,
  "/facility/:facilityId/patient/:id": ({ facilityId, id }) => (
    <PatientProfile facilityId={facilityId} id={id} page="demography" />
  ),
  // Before "/facility/:facilityId/patient/:id/:tab" — raviger matches routes
  // in object order, and "update" would otherwise be captured as a :tab.
  "/facility/:facilityId/patient/:id/update": ({ id }) => (
    <PatientRegistration patientId={id} />
  ),
  "/facility/:facilityId/patient/:id/:tab": ({ facilityId, id, tab }) => (
    <PatientProfileTabRoute facilityId={facilityId} id={id} tab={tab} />
  ),
  "/facility/:facilityId/patient/:patientId/history/:tab": ({
    facilityId,
    patientId,
    tab,
  }) => (
    <ClinicalHistoryPage
      patientId={patientId}
      facilityId={facilityId}
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
