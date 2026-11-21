import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Report templates live in the settings workspace. */
export const Route = createFileRoute("/_app/facility/$facilityId/template")({
  component: Outlet,
  staticData: { workspace: "settings" },
});
