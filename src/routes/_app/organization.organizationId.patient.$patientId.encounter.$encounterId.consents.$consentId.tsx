import { createFileRoute, useParams } from "@tanstack/react-router";

import { encounterShowSearch } from "@/lib/router/search/encounter";
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
  validateSearch: encounterShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, encounterId, consentId } = useParams({
    from: "/_app/organization/organizationId/patient/$patientId/encounter/$encounterId/consents/$consentId",
  });
  return (
    <EncounterProvider encounterId={encounterId} patientId={patientId}>
      <ConsentDetailPage consentId={consentId} />
    </EncounterProvider>
  );
}
