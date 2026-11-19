import { createFileRoute, useParams } from "@tanstack/react-router";

import UserHome from "@/components/Users/UserHome";

export const Route = createFileRoute("/_app/user/$tab")({
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = useParams({ from: "/_app/user/$tab" });
  return <UserHome tab={tab} />;
}
