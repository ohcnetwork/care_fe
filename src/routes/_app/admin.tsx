import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireSuperuser } from "@/lib/router/auth";

/** Admin pages show the admin sidebar. Only superusers can open them. */
export const Route = createFileRoute("/_app/admin")({
  beforeLoad: requireSuperuser,
  component: Outlet,
  staticData: { navigation: "admin" },
});
