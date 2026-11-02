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
 * than in the route map. Unknown tabs show the same not-found page as an
 * unmatched route.
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
