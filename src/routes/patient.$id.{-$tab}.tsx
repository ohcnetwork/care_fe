import { createFileRoute } from "@tanstack/react-router";

import { PluginPathNotFound } from "@/components/Common/PluginPathNotFound";
import { patientTabs } from "@/components/Patient/PatientDetailsTab";
import { PatientProfile } from "@/components/Patient/PatientProfile";

import { staffOrPatient } from "@/lib/router/auth";
import { useArea } from "@/Routers/AreaChrome";

type PatientTab = React.ComponentProps<typeof PatientProfile>["page"];

/**
 * Shared URL: the patient's own profile, or the staff patient page, with an
 * optional tab (default: demography). One route keeps `PatientProfile`
 * mounted when the user changes the tab. The staff page shows only the base
 * tabs; for any other name it shows not-found.
 * `/patient/$patientId/questionnaire` is a staff route with its own file, so
 * it wins over this one.
 */
export const Route = createFileRoute("/patient/$id/{-$tab}")({
  beforeLoad: staffOrPatient,
  component: RouteComponent,
});

function RouteComponent() {
  const { id, tab = "demography" } = Route.useParams();
  const isPatient = useArea() === "patient";
  const isStaffTab = patientTabs.some(({ route }) => route === tab);
  if (isPatient || isStaffTab) {
    return <PatientProfile id={id} page={tab as PatientTab} />;
  }
  return <PluginPathNotFound />;
}
