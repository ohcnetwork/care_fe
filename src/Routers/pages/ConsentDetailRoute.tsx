import { ConsentDetailPage } from "@/pages/Encounters/ConsentDetail";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

interface ConsentDetailRouteProps {
  encounterId: string;
  patientId: string;
  facilityId?: string;
  consentId: string;
}

/**
 * Route entry for an encounter consent. Keeping the provider and the page in
 * one lazily loaded module lets both download together instead of one after
 * the other.
 */
export function ConsentDetailRoute({
  encounterId,
  patientId,
  facilityId,
  consentId,
}: ConsentDetailRouteProps) {
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
