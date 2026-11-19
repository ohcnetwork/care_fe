import { createFileRoute, useParams } from "@tanstack/react-router";

import EncountersOverview from "@/pages/Encounters/EncountersOverview";
import type { EncounterClass } from "@/types/emr/encounter/encounter";

/**
 * All encounter overview URLs render one `EncountersOverview`. The child
 * routes have no component: they only select the tab, the encounter class
 * or the location. So the overview stays mounted when the user changes
 * them, as with the legacy table.
 */
export const Route = createFileRoute("/_app/facility/$facilityId/encounters")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  const { tab, encounterClass, locationId } = useParams({ strict: false });
  if (locationId) {
    return (
      <EncountersOverview
        facilityId={facilityId}
        tab="locations"
        locationId={locationId}
      />
    );
  }
  if (tab) {
    return <EncountersOverview facilityId={facilityId} tab={tab} />;
  }
  return (
    <EncountersOverview
      facilityId={facilityId}
      encounterClass={encounterClass as EncounterClass | undefined}
    />
  );
}
