import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/admin/organizations/product_supplier/$id",
)({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/organizations/product_supplier",
      replace: true,
    });
  },
});
