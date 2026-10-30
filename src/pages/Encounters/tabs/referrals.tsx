import { CreateReferralDialog } from "@/components/Referral/CreateReferralDialog";
import { ReferralList } from "@/components/Referral/ReferralList";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export function EncounterReferralsTab() {
  const {
    selectedEncounter,
    selectedEncounterPermissions,
    selectedEncounterId,
    patientId,
  } = useEncounter();

  if (
    !selectedEncounter ||
    selectedEncounter.id !== selectedEncounterId ||
    selectedEncounter.patient.id !== patientId
  )
    return null;

  if (!selectedEncounterPermissions.canReadReferral) {
    return selectedEncounterPermissions.canCreateReferral ? (
      <div className="flex justify-end">
        <CreateReferralDialog
          key={selectedEncounterId}
          encounter={selectedEncounter}
        />
      </div>
    ) : null;
  }

  return (
    <ReferralList
      key={selectedEncounterId}
      scope={{ patientId, encounterId: selectedEncounterId }}
      actions={
        selectedEncounterPermissions.canCreateReferral && (
          <CreateReferralDialog encounter={selectedEncounter} />
        )
      }
    />
  );
}
