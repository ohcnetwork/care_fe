import { createFileRoute } from "@tanstack/react-router";

import { ActionConfigurationForm } from "@/pages/Admin/actions/ActionConfigurationForm";

export const Route = createFileRoute("/_app/admin/actions/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ActionConfigurationForm />;
}
