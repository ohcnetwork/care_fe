import { createFileRoute } from "@tanstack/react-router";

import { plugConfigListSearch } from "@/lib/router/search/admin";
import { PlugConfigList } from "@/pages/Apps/PlugConfigList";

export const Route = createFileRoute("/_app/admin/apps/")({
  validateSearch: plugConfigListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <PlugConfigList />;
}
