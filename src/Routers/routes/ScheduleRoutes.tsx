import { Redirect } from "raviger";
import { lazy } from "react";

import type { AppRoutes } from "@/Routers/AppRouter";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

const AppointmentDetail = lazy(
  () => import("@/pages/Appointments/AppointmentDetail"),
);
const AppointmentPrint = lazy(
  () => import("@/pages/Appointments/AppointmentPrint"),
);
const AppointmentsPage = lazy(
  () => import("@/pages/Appointments/AppointmentsPage"),
);
const PrintAppointments = lazy(() =>
  import("@/pages/Appointments/components/PrintAppointments").then(
    (module) => ({
      default: module.PrintAppointments,
    }),
  ),
);
const ManageQueuePage = lazy(() =>
  import("@/pages/Facility/queues/ManageQueue").then((module) => ({
    default: module.ManageQueuePage,
  })),
);
const QueuesIndex = lazy(() => import("@/pages/Facility/queues/QueuesIndex"));
const TokenEncounterRedirect = lazy(
  () => import("@/pages/Facility/queues/TokenEncounterRedirect"),
);

const ScheduleRoutes: AppRoutes = {
  "/facility/:facilityId/appointments": () => (
    <AppointmentsPage resourceType={SchedulableResourceType.Practitioner} />
  ),
  "/facility/:facilityId/appointments/print": ({ facilityId }) => (
    <PrintAppointments
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Practitioner}
    />
  ),
  "/facility/:facilityId/patient/:patientId/appointments/:appointmentId": ({
    appointmentId,
  }) => <AppointmentDetail appointmentId={appointmentId} />,
  "/facility/:facilityId/patient/:patientId/appointments/:appointmentId/print":
    ({ appointmentId }) => <AppointmentPrint appointmentId={appointmentId} />,

  "/facility/:facilityId/queues": ({ facilityId }) => (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Practitioner}
    />
  ),

  "/facility/:facilityId/practitioner/:practitionerId/queues/:queueId": ({
    facilityId,
    practitionerId,
    queueId,
  }) => (
    <Redirect
      to={`/facility/${facilityId}/practitioner/${practitionerId}/queues/${queueId}/ongoing`}
    />
  ),
  "/facility/:facilityId/queue/:queueId/token/:tokenId": ({
    facilityId,
    queueId,
    tokenId,
  }) => (
    <TokenEncounterRedirect
      facilityId={facilityId}
      tokenId={tokenId}
      queueId={queueId}
    />
  ),

  "/facility/:facilityId/practitioner/:practitionerId/queues/:queueId/ongoing":
    ({ facilityId, practitionerId, queueId }) => (
      <ManageQueuePage
        facilityId={facilityId}
        resourceType={SchedulableResourceType.Practitioner}
        resourceId={practitionerId}
        queueId={queueId}
        tab="ongoing"
      />
    ),
  "/facility/:facilityId/practitioner/:practitionerId/queues/:queueId/completed":
    ({ facilityId, practitionerId, queueId }) => (
      <ManageQueuePage
        facilityId={facilityId}
        resourceType={SchedulableResourceType.Practitioner}
        resourceId={practitionerId}
        queueId={queueId}
        tab="completed"
      />
    ),
};

export default ScheduleRoutes;
