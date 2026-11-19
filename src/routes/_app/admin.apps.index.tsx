import { createFileRoute } from "@tanstack/react-router";

import { PlugConfigList } from "@/pages/Apps/PlugConfigList";

export const Route = createFileRoute("/_app/admin/apps/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PlugConfigList />;
}
