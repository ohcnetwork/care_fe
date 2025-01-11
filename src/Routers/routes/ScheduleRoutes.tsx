import { Redirect } from "raviger";

import useAuthUser from "@/hooks/useAuthUser";

import { AppRoutes } from "@/Routers/AppRouter";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import BookAppointment from "@/pages/Appointments/BookAppointment";

const HomeFacilityRedirect = ({ suffix }: { suffix: string }) => {
  const authUser = useAuthUser();
  const facilityId = authUser.home_facility!;

  return <Redirect to={`/facility/${facilityId}${suffix}`} />;
};

const ScheduleRoutes: AppRoutes = {
  // Appointments
  "/appointments": () => <HomeFacilityRedirect suffix="/appointments" />,
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
