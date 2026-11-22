import careConfig from "@careConfig";
import { createFileRoute } from "@tanstack/react-router";

import { redirectKeepingQuery } from "@/lib/router/auth";
import { facilitiesPageSearch } from "@/lib/router/search/facility";
import { FacilitiesPage } from "@/pages/Facility/FacilitiesPage";

export const Route = createFileRoute("/_public/facilities")({
  beforeLoad: ({ location }) => {
    if (careConfig.disablePatientLogin) {
      throw redirectKeepingQuery("/login", location);
    }
  },
  validateSearch: facilitiesPageSearch,
  component: FacilitiesPage,
});
