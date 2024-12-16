import { ReactNode } from "react";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { FacilityModel } from "@/components/Facility/models";
import AppointmentCreatePage from "@/components/Schedule/AppointmentCreatePage";
import AppointmentTokenPage from "@/components/Schedule/AppointmentTokenPage";
import AppointmentsPage from "@/components/Schedule/AppointmentsPage";

import useAuthUser from "@/hooks/useAuthUser";

import { AppRoutes } from "@/Routers/AppRouter";

/**
 * TODO: temp. hack to ensure that the user has a home facility until facility switcher is merged.
 */
export const HomeFacilityWrapper = ({
  children,
  user,
}: {
  children: ReactNode;
  user?: { home_facility_object?: FacilityModel };
}) => {
  const authUser = useAuthUser();
  const resolvedUser = user ?? authUser;

  if (!resolvedUser.home_facility_object) {
    return (
      <ErrorPage
        forError="CUSTOM_ERROR"
        title="No Home Facility"
        message="You need to be linked to a home facility to use this feature"
      />
    );
  }

  return children;
};

const ScheduleRoutes: AppRoutes = {
  // Appointments
  "/appointments": () => (
    <HomeFacilityWrapper>
      <AppointmentsPage />
    </HomeFacilityWrapper>
  ),

  "/facility/:facilityId/patient/:id/appointments/create": ({
    facilityId,
    id,
  }) => (
    <HomeFacilityWrapper>
      <AppointmentCreatePage facilityId={facilityId} patientId={id} />
    </HomeFacilityWrapper>
  ),

  "/facility/:facilityId/patient/:patientId/appointment/:appointmentId/token":
    ({ facilityId, appointmentId }) => (
      <HomeFacilityWrapper>
        <AppointmentTokenPage
          facilityId={facilityId}
          appointmentId={appointmentId}
        />
      </HomeFacilityWrapper>
    ),
};

export default ScheduleRoutes;
