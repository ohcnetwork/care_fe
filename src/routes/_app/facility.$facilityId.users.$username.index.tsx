import { createFileRoute } from "@tanstack/react-router";

import UserHome from "@/components/Users/UserHome";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/users/$username/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, username } = Route.useParams();
  return <UserHome facilityId={facilityId} username={username} tab="profile" />;
}
