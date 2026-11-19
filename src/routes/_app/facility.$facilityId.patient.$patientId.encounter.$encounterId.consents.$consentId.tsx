import { createFileRoute } from "@tanstack/react-router";

import { ConsentDetailPage } from "@/pages/Encounters/ConsentDetail";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/consents/$consentId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId, consentId } = Route.useParams();
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
