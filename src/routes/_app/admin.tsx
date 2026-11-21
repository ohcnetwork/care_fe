import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Admin pages show the admin sidebar. */
export const Route = createFileRoute("/_app/admin")({
  component: Outlet,
  staticData: { navigation: "admin" },
});
