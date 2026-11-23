import { createFileRoute } from "@tanstack/react-router";

import { facilitiesPageSearch } from "@/lib/router/search/facility";
import { FacilitiesPage } from "@/pages/Facility/FacilitiesPage";

export const Route = createFileRoute("/_patient/nearby_facilities")({
  validateSearch: facilitiesPageSearch,
  component: FacilitiesPage,
});
