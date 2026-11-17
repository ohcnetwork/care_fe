import { createFileRoute } from "@tanstack/react-router";

import { PatientProfile } from "@/components/Patient/PatientProfile";

import { staffOrPatient } from "@/lib/router/auth";
import AppRouter from "@/Routers/AppRouter";
import { useArea } from "@/Routers/AreaChrome";

type PatientTab = React.ComponentProps<typeof PatientProfile>["page"];

/**
 * Shared URL: a tab of the patient's own profile, or the legacy staff
 * page (for example `/patient/:id/questionnaire`).
 */
export const Route = createFileRoute("/patient/$id/$tab")({
  beforeLoad: staffOrPatient,
  staticData: { legacyLayout: true },
  component: RouteComponent,
});

function RouteComponent() {
  const { id, tab } = Route.useParams();
  if (useArea() !== "patient") return <AppRouter />;
  return <PatientProfile id={id} page={tab as PatientTab} />;
}
