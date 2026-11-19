import { createFileRoute, useParams } from "@tanstack/react-router";

import { PlugConfigEdit } from "@/pages/Apps/PlugConfigEdit";

export const Route = createFileRoute("/_app/admin/apps/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = useParams({ from: "/_app/admin/apps/$slug" });
  return <PlugConfigEdit slug={slug} />;
}
