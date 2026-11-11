import { getPermissions } from "@/common/Permissions";
import { CreateReferralDialog } from "@/components/Referral/CreateReferralDialog";
import { ReferralList } from "@/components/Referral/ReferralList";
import { usePermissions } from "@/context/PermissionContext";

import { PatientProps } from ".";

export function PatientReferralsTab({
  patientId,
  patientData,
  facilityId,
}: PatientProps) {
  const { hasPermission } = usePermissions();
  const { canReadReferral, canCreateReferral } = getPermissions(
    hasPermission,
    patientData.permissions ?? [],
  );
  if (patientData.id !== patientId) return null;

  const createAction = canCreateReferral && (
    <CreateReferralDialog
      key={patientId}
      patientId={patientId}
      facilityId={facilityId}
    />
  );

  if (!canReadReferral) {
    return createAction ? (
      <div className="flex justify-end">{createAction}</div>
    ) : null;
  }

  return <ReferralList scope={{ patientId }} actions={createAction} />;
}
