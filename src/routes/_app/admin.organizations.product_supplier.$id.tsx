import { createFileRoute, useParams } from "@tanstack/react-router";

import AdminOrganizationList from "@/pages/Admin/organizations/AdminOrganizationList";

export const Route = createFileRoute(
  "/_app/admin/organizations/product_supplier/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({
    from: "/_app/admin/organizations/product_supplier/$id",
  });
  return (
    <AdminOrganizationList
      organizationType="product_supplier"
      organizationId={id}
    />
  );
}
