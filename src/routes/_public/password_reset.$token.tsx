import { createFileRoute, useParams } from "@tanstack/react-router";

import ResetPassword from "@/components/Auth/ResetPassword";

export const Route = createFileRoute("/_public/password_reset/$token")({
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = useParams({ from: "/_public/password_reset/$token" });
  return <ResetPassword token={token} />;
}
