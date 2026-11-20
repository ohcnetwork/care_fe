import { createFileRoute, useParams } from "@tanstack/react-router";

import {
  encounterQuery,
  patientQuery,
  startQuery,
} from "@/lib/router/pageQueries";
import { fullScreenPage } from "@/lib/router/staticData";
import { EncounterShow } from "@/pages/Encounters/EncounterShow";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

/** Encounter tabs give the full width to the chart and carry their own back button. */
export const Route = createFileRoute(
  "/_app/organization/$organizationId/patient/$patientId/encounter/$encounterId/$tab",
)({
  loader: ({ context, params: { patientId, encounterId } }) => {
    startQuery(context, patientQuery(patientId, undefined, { silent: true }));
    startQuery(context, encounterQuery(encounterId, { patientId }));
  },
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
