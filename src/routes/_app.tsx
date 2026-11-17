import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/Routers/AppShell";

/** Signed-in area: app chrome (sidebar, headers) around every child route. */
export const Route = createFileRoute("/_app")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
