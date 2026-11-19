import { createFileRoute } from "@tanstack/react-router";

import careConfig from "@careConfig";

import { redirectKeepingQuery } from "@/lib/router/auth";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/encounters/patients/",
)({
  beforeLoad: ({ params, location }) => {
    throw redirectKeepingQuery(
      `/facility/${params.facilityId}/encounters/patients/${
        careConfig.defaultEncounterType || "all"
      }`,
      location,
    );
  },
});
