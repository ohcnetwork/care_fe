import { createFileRoute, useParams } from "@tanstack/react-router";

import { GeneralSettings } from "@/pages/Facility/settings/general/general";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/general",
)({
  component: RouteComponent,
  staticData: { crumb: "general" },
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/general",
  });
  return <GeneralSettings facilityId={facilityId} />;
}
