import { Redirect } from "raviger";

import AppointmentCreatePage from "@/components/Schedule/Appointments/AppointmentCreatePage";
import AppointmentDetailsPage from "@/components/Schedule/Appointments/AppointmentDetailsPage";
import AppointmentsPage from "@/components/Schedule/Appointments/AppointmentsPage";

import useAuthUser from "@/hooks/useAuthUser";

import { AppRoutes } from "@/Routers/AppRouter";

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
  }) => <AppointmentCreatePage facilityId={facilityId} patientId={patientId} />,

  "/facility/:facilityId/patient/:patientId/appointments/:appointmentId": ({
    facilityId,
    appointmentId,
  }) => (
    <AppointmentDetailsPage
      facilityId={facilityId}
      appointmentId={appointmentId}
    />
  ),
};

export default ScheduleRoutes;
