import { EncounterShow } from "@/pages/Encounters/EncounterShow";
import { EncounterProvider } from "@/pages/Encounters/utils/EncounterProvider";

interface EncounterShowRouteProps {
  encounterId: string;
  patientId: string;
  facilityId?: string;
  tab: string;
}

/**
 * Route entry for the encounter page. Keeping the provider and the page in one
 * lazily loaded module lets both download together instead of one after the
 * other.
 */
export function EncounterShowRoute({
  encounterId,
  patientId,
  facilityId,
  tab,
}: EncounterShowRouteProps) {
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
