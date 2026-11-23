import { createFileRoute, useParams } from "@tanstack/react-router";

import { encounterShowSearch } from "@/lib/router/search/encounter";
import { fullScreenPage } from "@/lib/router/staticData";
import { EncounterShow } from "@/pages/Encounters/EncounterShow";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

/** Encounter tabs give the full width to the chart and carry their own back button. */
export const Route = createFileRoute(
  "/_app/organization/$organizationId/patient/$patientId/encounter/$encounterId/$tab",
)({
  validateSearch: encounterShowSearch,
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { patientId, encounterId, tab } = useParams({
    from: "/_app/organization/$organizationId/patient/$patientId/encounter/$encounterId/$tab",
  });
  return (
    <EncounterProvider encounterId={encounterId} patientId={patientId}>
      <EncounterShow tab={tab} />
    </EncounterProvider>
  );
}
