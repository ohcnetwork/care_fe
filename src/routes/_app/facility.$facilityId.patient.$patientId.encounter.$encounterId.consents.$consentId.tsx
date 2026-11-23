import { createFileRoute, useParams } from "@tanstack/react-router";

import { encounterShowSearch } from "@/lib/router/search/encounter";
import { ConsentDetailPage } from "@/pages/Encounters/ConsentDetail";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/consents/$consentId",
)({
  validateSearch: encounterShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId, consentId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/consents/$consentId",
  });
  return (
    <EncounterProvider
      encounterId={encounterId}
      patientId={patientId}
      facilityId={facilityId}
    >
      <ConsentDetailPage consentId={consentId} />
    </EncounterProvider>
  );
}
