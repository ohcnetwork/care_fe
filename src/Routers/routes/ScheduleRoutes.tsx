import { AppRoutes } from "@/Routers/AppRouter";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import BookAppointment from "@/pages/Appointments/BookAppointment";

const ScheduleRoutes: AppRoutes = {
  "/facility/:facilityId/appointments": () => <AppointmentsPage />,

  "/facility/:facilityId/patient/:patientId/book-appointment": ({
    patientId,
  }) => <BookAppointment patientId={patientId} />,

  "/facility/:facilityId/patient/:patientId/appointments/:appointmentId": ({
    appointmentId,
  }) => <AppointmentDetail appointmentId={appointmentId} />,
};

export default ScheduleRoutes;
