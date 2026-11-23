import { createFileRoute, useParams } from "@tanstack/react-router";

import { encounterShowSearch } from "@/lib/router/search/encounter";
import { fullScreenPage } from "@/lib/router/staticData";
import { EncounterShow } from "@/pages/Encounters/EncounterShow";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

/** Encounter tabs give the full width to the chart and carry their own back button. */
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab",
)({
  validateSearch: encounterShowSearch,
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId, tab } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab",
  });
  return (
    <EncounterProvider
      encounterId={encounterId}
      patientId={patientId}
      facilityId={facilityId}
    >
      <EncounterShow tab={tab} />
    </EncounterProvider>
  );
}
