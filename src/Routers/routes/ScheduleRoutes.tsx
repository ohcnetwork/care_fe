import { AppRoutes } from "@/Routers/AppRouter";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import BookAppointment from "@/pages/Appointments/BookAppointment";
import QueuesIndex from "@/pages/Facility/queues/QueuesIndex";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

const ScheduleRoutes: AppRoutes = {
  "/facility/:facilityId/appointments": () => (
    <AppointmentsPage resourceType={SchedulableResourceType.Practitioner} />
  ),

  "/facility/:facilityId/patient/:patientId/book-appointment": ({
    patientId,
  }) => <BookAppointment patientId={patientId} />,

  "/facility/:facilityId/patient/:patientId/appointments/:appointmentId": ({
    appointmentId,
  }) => <AppointmentDetail appointmentId={appointmentId} />,

  "/facility/:facilityId/queues": ({ facilityId }) => (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Practitioner}
    />
  ),
};

export default ScheduleRoutes;
