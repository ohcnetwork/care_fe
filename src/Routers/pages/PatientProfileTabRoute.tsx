import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { patientTabs } from "@/components/Patient/PatientDetailsTab";
import { PatientProfile } from "@/components/Patient/PatientProfile";

interface PatientProfileTabRouteProps {
  facilityId?: string;
  id: string;
  tab: string;
}

/**
 * Route entry for `/patient/:id/:tab`. The list of tabs lives next to the tab
 * components, so it is checked here, inside the lazily loaded page, rather
 * than in the route map. Tabs that don't exist at all show the same not-found
 * page as an unmatched route. Permission filtering is separate: it still
 * happens inside `PatientProfile` (via `getPatientTabs`), so a known tab this
 * user can't see behaves as it did before this route existed.
 */
export function PatientProfileTabRoute({
  facilityId,
  id,
  tab,
}: PatientProfileTabRouteProps) {
  if (!patientTabs.some((patientTab) => patientTab.route === tab)) {
    return <ErrorPage />;
  }

  return <PatientProfile facilityId={facilityId} id={id} page={tab} />;
}
