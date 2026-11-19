import { createFileRoute } from "@tanstack/react-router";

import TokenCategoryList from "@/pages/Facility/settings/tokenCategory/TokenCategoryList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/token_category",
)({
  component: RouteComponent,
  staticData: { crumb: "token_category" },
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <TokenCategoryList facilityId={facilityId} />;
}
