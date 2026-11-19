import { createFileRoute } from "@tanstack/react-router";

import ResetPassword from "@/components/Auth/ResetPassword";

export const Route = createFileRoute("/_public/password_reset/$token")({
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useParams();
  return <ResetPassword token={token} />;
}
