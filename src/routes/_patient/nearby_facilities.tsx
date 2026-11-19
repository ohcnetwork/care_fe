import { createFileRoute } from "@tanstack/react-router";

import { FacilitiesPage } from "@/pages/Facility/FacilitiesPage";

export const Route = createFileRoute("/_patient/nearby_facilities")({
  component: FacilitiesPage,
});
