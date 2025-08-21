import { AppRoutes } from "@/Routers/AppRouter";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import BookAppointment from "@/pages/Appointments/BookAppointment/BookAppointment";

const ScheduleRoutes: AppRoutes = {
  "/facility/:facilityId/appointments": () => <AppointmentsPage />,

  "/facility/:facilityId/patient/:patientId/book-appointment": ({
    patientId,
    facilityId,
  }) => <BookAppointment patientId={patientId} facilityId={facilityId} />,

  "/facility/:facilityId/patient/:patientId/appointments/:appointmentId": ({
    appointmentId,
  }) => <AppointmentDetail appointmentId={appointmentId} />,
};

export default ScheduleRoutes;
