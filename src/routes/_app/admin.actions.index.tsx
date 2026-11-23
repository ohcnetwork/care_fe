import { createFileRoute } from "@tanstack/react-router";

import { actionConfigurationListSearch } from "@/lib/router/search/admin";
import { ActionConfigurationList } from "@/pages/Admin/actions/ActionConfigurationList";

export const Route = createFileRoute("/_app/admin/actions/")({
  validateSearch: actionConfigurationListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <ActionConfigurationList />;
}
