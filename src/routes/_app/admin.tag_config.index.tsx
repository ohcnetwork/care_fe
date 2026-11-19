import { createFileRoute } from "@tanstack/react-router";

import TagConfigList from "@/pages/Admin/TagConfig/TagConfigList";

export const Route = createFileRoute("/_app/admin/tag_config/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <TagConfigList />;
}
