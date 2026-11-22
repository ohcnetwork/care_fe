import careConfig from "@careConfig";
import { createFileRoute, useParams } from "@tanstack/react-router";

import { redirectKeepingQuery } from "@/lib/router/auth";
import { facilityDetailsPageSearch } from "@/lib/router/search/facility";
import { FacilityDetailsPage } from "@/pages/Facility/FacilityDetailsPage";

export const Route = createFileRoute("/_public/facility/$id")({
  beforeLoad: ({ location }) => {
    if (careConfig.disablePatientLogin) {
      throw redirectKeepingQuery("/login", location);
    }
  },
  validateSearch: facilityDetailsPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_public/facility/$id" });
  return <FacilityDetailsPage id={id} />;
}
