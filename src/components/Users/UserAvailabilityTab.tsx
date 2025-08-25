import Loading from "@/components/Common/Loading";
import { userChildProps } from "@/components/Common/UserColumns";

import { getPermissions } from "@/common/Permissions";

import { ScheduleHome } from "@/components/Schedule/ScheduleHome";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export default function UserAvailabilityTab({
  userData: user,
  permissions,
}: userChildProps) {
  const { facilityId } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const { canViewSchedule } = getPermissions(hasPermission, permissions ?? []);

  if (!facilityId || !canViewSchedule) {
    return <Loading />;
  }

  return (
    <ScheduleHome
      resourceType={SchedulableResourceType.Practitioner}
      resourceId={user.id}
      facilityId={facilityId}
    />
  );
}
