import { createFileRoute } from "@tanstack/react-router";

import { tagConfigListSearch } from "@/lib/router/search/admin";
import TagConfigList from "@/pages/Admin/TagConfig/TagConfigList";

export const Route = createFileRoute("/_app/admin/tag_config/")({
  validateSearch: tagConfigListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <TagConfigList />;
}
