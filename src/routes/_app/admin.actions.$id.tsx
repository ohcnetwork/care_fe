import { createFileRoute, useParams } from "@tanstack/react-router";

import { ActionConfigurationForm } from "@/pages/Admin/actions/ActionConfigurationForm";

export const Route = createFileRoute("/_app/admin/actions/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/actions/$id" });
  return <ActionConfigurationForm id={id} />;
}
