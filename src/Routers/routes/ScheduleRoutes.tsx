import { AppRoutes } from "@/Routers/AppRouter";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentPrint from "@/pages/Appointments/AppointmentPrint";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { PrintAppointments } from "@/pages/Appointments/components/PrintAppointments";
import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import QueuesIndex from "@/pages/Facility/queues/QueuesIndex";
import { TokenDisplay } from "@/pages/Facility/queues/TokenDisplay";
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

  // `encodedResources` would be of the format "l:resourceId1,p:resourceId2,"
  "/facility/:facilityId/token_display/:encodedResources": ({
    facilityId,
    encodedResources,
  }) => {
    const resources = (encodedResources as string)
      .split(",")
      .map((resourceStr) => {
        const [type, id] = resourceStr.split(":");
        return {
          resourceType: {
            p: SchedulableResourceType.Practitioner,
            l: SchedulableResourceType.Location,
            h: SchedulableResourceType.HealthcareService,
          }[type]!,
          resourceId: id,
        };
      });
    return <TokenDisplay facilityId={facilityId} resources={resources} />;
  },
};

export default ScheduleRoutes;
