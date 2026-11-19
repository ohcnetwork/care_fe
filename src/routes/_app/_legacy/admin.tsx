import { createFileRoute } from "@tanstack/react-router";

/** Admin pages show the admin sidebar. */
export const Route = createFileRoute("/_app/_legacy/admin")({
  staticData: { navigation: "admin" },
});
