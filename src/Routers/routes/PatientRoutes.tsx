import { Suspense, lazy } from "react";

import Loading from "@/components/Common/Loading";
import { patientTabs } from "@/components/Patient/PatientDetailsTab";
import { PatientDrawingTab } from "@/components/Patient/PatientDetailsTab/PatientDrawingsTab";
import { PatientHome } from "@/components/Patient/PatientHome";
import PatientIndex from "@/components/Patient/PatientIndex";
import PatientRegistration from "@/components/Patient/PatientRegistration";

import { AppRoutes } from "@/Routers/AppRouter";
import { EncounterList } from "@/pages/Encounters/EncounterList";
import VerifyPatient from "@/pages/Patients/VerifyPatient";

const ExcalidrawEditor = lazy(
  () => import("@/components/Common/Drawings/ExcalidrawEditor"),
);

const PatientRoutes: AppRoutes = {
  "/facility/:facilityId/patients": ({ facilityId }) => (
    <PatientIndex facilityId={facilityId} />
  ),
  "/facility/:facilityId/encounters": ({ facilityId }) => (
    <EncounterList facilityId={facilityId} />
  ),
  "/facility/:facilityId/patients/verify": ({ facilityId }) => (
    <VerifyPatient facilityId={facilityId} />
  ),
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
  "/patient/:patientId/drawings": ({ patientId }) => (
    <PatientDrawingTab patientId={patientId} />
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
};

export default PatientRoutes;
