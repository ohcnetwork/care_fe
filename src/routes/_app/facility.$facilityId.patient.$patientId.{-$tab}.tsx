import { createFileRoute } from "@tanstack/react-router";

import { PluginPathNotFound } from "@/components/Common/PluginPathNotFound";
import { patientTabs } from "@/components/Patient/PatientDetailsTab";
import { PatientProfile } from "@/components/Patient/PatientProfile";

type PatientTab = React.ComponentProps<typeof PatientProfile>["page"];

/**
 * The patient page and all its tabs. One route (with an optional `tab`)
 * keeps `PatientProfile` mounted when the user changes the tab, as the
 * legacy table did. Static sibling routes (`update`, `consultation`,
 * `questionnaire`, plugin pages) win over the optional param.
 */
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/{-$tab}",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, tab = "demography" } = Route.useParams();
  if (!patientTabs.some(({ route }) => route === tab)) {
    return <PluginPathNotFound />;
  }
  return (
    <PatientProfile
      facilityId={facilityId}
      id={patientId}
      page={tab as PatientTab}
    />
  );
}
