import { createFileRoute } from "@tanstack/react-router";

import { PatientProfile } from "@/components/Patient/PatientProfile";

import { staffOrPatient } from "@/lib/router/auth";

/**
 * Shared URL: the patient's own profile, or the staff patient page. Both
 * render the same page in the chrome of their area.
 */
export const Route = createFileRoute("/patient/$id/")({
  beforeLoad: staffOrPatient,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <PatientProfile id={id} page="demography" />;
}
