import { createFileRoute } from "@tanstack/react-router";

import UserHome from "@/components/Users/UserHome";

export const Route = createFileRoute("/_app/user/$tab")({
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useParams();
  return <UserHome tab={tab} />;
}
