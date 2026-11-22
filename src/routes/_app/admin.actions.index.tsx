import { createFileRoute } from "@tanstack/react-router";

import { ActionConfigurationList } from "@/pages/Admin/actions/ActionConfigurationList";

export const Route = createFileRoute("/_app/admin/actions/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ActionConfigurationList />;
}
