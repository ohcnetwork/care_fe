import { createFileRoute } from "@tanstack/react-router";

import { PatientProfile } from "@/components/Patient/PatientProfile";

import { staffOrPatient } from "@/lib/router/auth";
import AppRouter from "@/Routers/AppRouter";
import { useArea } from "@/Routers/AreaChrome";

/** Shared URL: the patient's own profile, or the legacy staff page. */
export const Route = createFileRoute("/patient/$id/")({
  beforeLoad: staffOrPatient,
  staticData: { legacyLayout: true },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  if (useArea() !== "patient") return <AppRouter />;
  return <PatientProfile id={id} page="demography" />;
}
