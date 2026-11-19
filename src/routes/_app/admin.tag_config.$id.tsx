import { createFileRoute, useParams } from "@tanstack/react-router";

import TagConfigView from "@/pages/Admin/TagConfig/TagConfigView";

export const Route = createFileRoute("/_app/admin/tag_config/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/tag_config/$id" });
  return <TagConfigView tagId={id} />;
}
