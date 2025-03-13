import { useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { UserBase } from "@/types/user/user";

export const useIsUserSchedulableResource = (
  facilityId: string,
  userId: string,
) => {
  return useQuery({
    queryKey: ["is_schedulable_resource", facilityId, userId],
    queryFn: query(scheduleApis.appointments.availableUsers, {
      pathParams: { facility_id: facilityId },
    }),
    select: (data: { users: UserBase[] }) =>
      data.users.some(({ id }) => id === userId),
  });
};
