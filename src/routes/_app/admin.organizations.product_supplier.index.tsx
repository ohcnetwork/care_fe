import { createFileRoute } from "@tanstack/react-router";

import AdminOrganizationList from "@/pages/Admin/organizations/AdminOrganizationList";

export const Route = createFileRoute(
  "/_app/admin/organizations/product_supplier/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <AdminOrganizationList organizationType="product_supplier" />;
}
