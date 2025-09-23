import { useScheduleResourceFromPath } from "@/components/Schedule/useScheduleResource";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const atom = atomWithStorage<Record<string, string>>(
  "care_queues_preferred_service_point_category",
  {},
  undefined,
  { getOnInit: true },
);

function usePreferredServicePointCategory({
  facilityId,
}: {
  facilityId: string;
}) {
  const { resourceType } = useScheduleResourceFromPath();
  const [
    preferredServicePointCategoryIds,
    setPreferredServicePointCategoryIds,
  ] = useAtom(atom);

  const { data: tokenCategories } = useQuery({
    queryKey: ["tokenCategories", facilityId, resourceType],
    queryFn: query(tokenCategoryApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        limit: 100,
      },
    }),
  });

  const preferredServicePointCategories =
    tokenCategories &&
    Object.fromEntries(
      Object.entries(preferredServicePointCategoryIds).map(
        ([subQueueId, categoryId]) => [
          subQueueId,
          tokenCategories.results.find(({ id }) => id === categoryId),
        ],
      ),
    );

  const setPreferredServicePointCategory = (
    subQueueId: string,
    categoryId: string | null,
  ) => {
    const updated = { ...preferredServicePointCategoryIds };
    if (categoryId) {
      updated[subQueueId] = categoryId;
    } else {
      delete updated[subQueueId];
    }
    setPreferredServicePointCategoryIds(updated);
  };

  return {
    preferredServicePointCategories,
    setPreferredServicePointCategory,
  } as const;
}

export { usePreferredServicePointCategory };
