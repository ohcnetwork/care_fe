import { createFileRoute, useParams } from "@tanstack/react-router";

import UserHome from "@/components/Users/UserHome";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/users/$username/$tab",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, username, tab } = useParams({
    from: "/_app/facility/$facilityId/users/$username/$tab",
  });
  return <UserHome facilityId={facilityId} username={username} tab={tab} />;
}
