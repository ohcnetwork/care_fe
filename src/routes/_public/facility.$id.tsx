import careConfig from "@careConfig";
import { createFileRoute } from "@tanstack/react-router";

import { redirectKeepingQuery } from "@/lib/router/auth";
import { FacilityDetailsPage } from "@/pages/Facility/FacilityDetailsPage";

export const Route = createFileRoute("/_public/facility/$id")({
  beforeLoad: ({ location }) => {
    if (careConfig.disablePatientLogin) {
      throw redirectKeepingQuery("/login", location);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <FacilityDetailsPage id={id} />;
}
