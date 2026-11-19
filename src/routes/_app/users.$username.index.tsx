import { createFileRoute } from "@tanstack/react-router";

import UserHome from "@/components/Users/UserHome";

export const Route = createFileRoute("/_app/users/$username/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();
  return <UserHome username={username} tab="profile" />;
}
