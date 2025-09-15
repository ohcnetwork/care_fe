import { AppRoutes } from "@/Routers/AppRouter";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { PrintAppointments } from "@/pages/Appointments/components/PrintAppointments";
import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import ManageToken from "@/pages/Facility/queues/ManageToken";
import QueuesIndex from "@/pages/Facility/queues/QueuesIndex";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { Redirect } from "raviger";

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

  "/facility/:facilityId/queues": ({ facilityId }) => (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Practitioner}
    />
  ),

  "/facility/:facilityId/queues/:queueId/practitioner/:practitionerId": ({
    facilityId,
    practitionerId,
    queueId,
  }) => (
    <Redirect
      to={`/facility/${facilityId}/queues/${queueId}/practitioner/${practitionerId}/ongoing`}
    />
  ),

  "/facility/:facilityId/queues/:queueId/practitioner/:practitionerId/ongoing":
    ({ facilityId, practitionerId, queueId }) => (
      <ManageQueuePage
        facilityId={facilityId}
        resourceType={SchedulableResourceType.Practitioner}
        resourceId={practitionerId}
        queueId={queueId}
        tab="ongoing"
      />
    ),
  "/facility/:facilityId/queues/:queueId/practitioner/:practitionerId/completed":
    ({ facilityId, practitionerId, queueId }) => (
      <ManageQueuePage
        facilityId={facilityId}
        resourceType={SchedulableResourceType.Practitioner}
        resourceId={practitionerId}
        queueId={queueId}
        tab="completed"
      />
    ),
  // Routes for Token Show Page
  "/facility/:facilityId/queues/:queueId/tokens/:tokenId": ({
    facilityId,
    tokenId,
    queueId,
  }) => (
    <ManageToken facilityId={facilityId} tokenId={tokenId} queueId={queueId} />
  ),
};

export default ScheduleRoutes;
