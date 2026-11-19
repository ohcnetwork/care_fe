import { createFileRoute } from "@tanstack/react-router";

import { PlugConfigEdit } from "@/pages/Apps/PlugConfigEdit";

export const Route = createFileRoute("/_app/admin/apps/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <PlugConfigEdit slug={slug} />;
}
