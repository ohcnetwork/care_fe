import { AppRoutes } from "@/Routers/AppRouter";
import { lazyPage } from "@/Routers/lazyPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { Redirect } from "raviger";

const AppointmentDetail = lazyPage(
  () => import("@/pages/Appointments/AppointmentDetail"),
);
const AppointmentPrint = lazyPage(
  () => import("@/pages/Appointments/AppointmentPrint"),
);
const AppointmentsPage = lazyPage(
  () => import("@/pages/Appointments/AppointmentsPage"),
);
const PrintAppointments = lazyPage(
  () => import("@/pages/Appointments/components/PrintAppointments"),
  "PrintAppointments",
);
const ManageQueuePage = lazyPage(
  () => import("@/pages/Facility/queues/ManageQueue"),
  "ManageQueuePage",
);
const QueuesIndex = lazyPage(
  () => import("@/pages/Facility/queues/QueuesIndex"),
);
const TokenEncounterRedirect = lazyPage(
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
