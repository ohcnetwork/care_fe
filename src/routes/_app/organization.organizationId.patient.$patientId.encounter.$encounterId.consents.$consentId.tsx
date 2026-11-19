import { createFileRoute } from "@tanstack/react-router";

import { ConsentDetailPage } from "@/pages/Encounters/ConsentDetail";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

/**
 * The first segment after `organization` is the literal text
 * `organizationId`, not a param. The old route table had it this way. The
 * page gets no facility.
 */
export const Route = createFileRoute(
  "/_app/organization/organizationId/patient/$patientId/encounter/$encounterId/consents/$consentId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, encounterId, consentId } = Route.useParams();
  return (
    <EncounterProvider encounterId={encounterId} patientId={patientId}>
      <ConsentDetailPage consentId={consentId} />
    </EncounterProvider>
  );
}
