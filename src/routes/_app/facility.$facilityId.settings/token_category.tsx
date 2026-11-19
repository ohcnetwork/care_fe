import { createFileRoute, useParams } from "@tanstack/react-router";

import TokenCategoryList from "@/pages/Facility/settings/tokenCategory/TokenCategoryList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/token_category",
)({
  component: RouteComponent,
  staticData: { crumb: "token_category" },
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/token_category",
  });
  return <TokenCategoryList facilityId={facilityId} />;
}
