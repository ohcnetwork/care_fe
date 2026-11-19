import { createFileRoute, useParams } from "@tanstack/react-router";

import UserHome from "@/components/Users/UserHome";

export const Route = createFileRoute("/_app/users/$username/$tab")({
  component: RouteComponent,
});

function RouteComponent() {
  const { username, tab } = useParams({ from: "/_app/users/$username/$tab" });
  return <UserHome username={username} tab={tab} />;
}
