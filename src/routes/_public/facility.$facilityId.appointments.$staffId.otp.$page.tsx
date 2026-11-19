import careConfig from "@careConfig";
import { createFileRoute } from "@tanstack/react-router";

import { redirectKeepingQuery } from "@/lib/router/auth";
import PatientLogin from "@/pages/PublicAppointments/auth/PatientLogin";

export const Route = createFileRoute(
  "/_public/facility/$facilityId/appointments/$staffId/otp/$page",
)({
  beforeLoad: ({ location }) => {
    if (careConfig.disablePatientLogin) {
      throw redirectKeepingQuery("/login", location);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, staffId, page } = Route.useParams();
  return <PatientLogin facilityId={facilityId} staffId={staffId} page={page} />;
}
