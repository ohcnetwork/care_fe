import { useQueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";

import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import { LocationRead } from "@/types/location/location";

interface LocationTagsProps {
  location: Pick<LocationRead, "id" | "tags">;
  facilityId: string;
  trigger?: ReactNode;
}

export function LocationTags({
  location,
  facilityId,
  trigger,
}: LocationTagsProps) {
  const queryClient = useQueryClient();

  return (
    <TagAssignmentSheet
      entityType="location"
      entityId={location.id}
      facilityId={facilityId}
      currentTags={location.tags ?? []}
      onUpdate={() => {
        queryClient.invalidateQueries({
          queryKey: ["locations", facilityId],
        });
        queryClient.invalidateQueries({
          queryKey: ["location", facilityId],
        });
      }}
      trigger={trigger}
    />
  );
}
