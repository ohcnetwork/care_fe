import { createFileRoute } from "@tanstack/react-router";

import SelectProfile from "@/pages/Patient/SelectProfile";

export const Route = createFileRoute("/_patient/patient/select-profile")({
  component: SelectProfile,
});
