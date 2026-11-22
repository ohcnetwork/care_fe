import { createFileRoute, useParams } from "@tanstack/react-router";

import { plugConfigEditSearch } from "@/lib/router/search/admin";
import { PlugConfigEdit } from "@/pages/Apps/PlugConfigEdit";

export const Route = createFileRoute("/_app/admin/apps/$slug")({
  validateSearch: plugConfigEditSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = useParams({ from: "/_app/admin/apps/$slug" });
  return <PlugConfigEdit slug={slug} />;
}
