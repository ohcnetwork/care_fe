import { AppRoutes } from "@/Routers/AppRouter";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import BookAppointment from "@/pages/Appointments/BookAppointment";

const ScheduleRoutes: AppRoutes = {
  "/facility/:facilityId/appointments": ({ facilityId }) => (
    <AppointmentsPage facilityId={facilityId} />
  ),

  "/facility/:facilityId/patient/:patientId/book-appointment": ({
    facilityId,
    patientId,
  }) => <BookAppointment facilityId={facilityId} patientId={patientId} />,

  "/facility/:facilityId/patient/:patientId/appointments/:appointmentId": ({
    facilityId,
    appointmentId,
  }) => (
    <AppointmentDetail facilityId={facilityId} appointmentId={appointmentId} />
  ),
};

export default ScheduleRoutes;
