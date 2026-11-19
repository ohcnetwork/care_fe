import { createFileRoute } from "@tanstack/react-router";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { patientTabs } from "@/components/Patient/PatientDetailsTab";
import { PatientProfile } from "@/components/Patient/PatientProfile";

import { useCareApps } from "@/hooks/useCareApps";

import { Spinner } from "@/components/ui/spinner";

import { staffOrPatient } from "@/lib/router/auth";
import { useArea } from "@/Routers/AreaChrome";

type PatientTab = React.ComponentProps<typeof PatientProfile>["page"];

/**
 * Shared URL: a tab of the patient's own profile, or a tab of the staff
 * patient page. The staff page shows only the base tabs. For any other
 * name it shows not-found. `/patient/$patientId/questionnaire` is a staff
 * route with its own file, so it wins over this one.
 */
export const Route = createFileRoute("/patient/$id/$tab")({
  beforeLoad: staffOrPatient,
  component: RouteComponent,
});

function RouteComponent() {
  const { id, tab } = Route.useParams();
  const isPatient = useArea() === "patient";
  const isStaffTab = patientTabs.some(({ route }) => route === tab);
  if (isPatient || isStaffTab) {
    return <PatientProfile id={id} page={tab as PatientTab} />;
  }
  return <StaffUnknownTab />;
}

/** A plugin can own this path. Wait for the plugin manifests before not-found. */
function StaffUnknownTab() {
  const careApps = useCareApps();
  if (careApps.some((app) => app.isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner role="status" aria-label="Loading" className="size-6" />
      </div>
    );
  }
  return <ErrorPage />;
}
