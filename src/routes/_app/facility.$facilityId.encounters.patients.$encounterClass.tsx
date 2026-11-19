import { createFileRoute } from "@tanstack/react-router";

import EncountersOverview from "@/pages/Encounters/EncountersOverview";
import type { EncounterClass } from "@/types/emr/encounter/encounter";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/encounters/patients/$encounterClass",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, encounterClass } = Route.useParams();
  return (
    <EncountersOverview
      facilityId={facilityId}
      encounterClass={encounterClass as EncounterClass}
    />
  );
}
