import { useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { UserReadBase } from "@/types/user/user";

export const useIsUserSchedulableResource = (
  facilityId: string,
  userId: string,
) => {
  return useQuery({
    queryKey: ["is_schedulable_resource", facilityId, userId],
    queryFn: query(scheduleApis.appointments.availableUsers, {
      pathParams: { facilityId },
    }),
    select: (data: { users: UserReadBase[] }) =>
      data.users.some(({ id }) => id === userId),
  });
};
