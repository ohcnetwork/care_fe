import { SchedulableResourceType } from "@/types/scheduling/schedule";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const atom = atomWithStorage<Record<string, string | undefined>>(
  "care_queues_preferred_service_point_category",
  {},
  undefined,
  { getOnInit: true },
);

function usePreferredServicePointCategory({
  facilityId,
  subQueueId,
  resourceType,
}: {
  facilityId: string;
  subQueueId: string;
  resourceType: SchedulableResourceType;
}) {
  const [preferredServicePointCategory, setPreferredServicePointCategory] =
    useAtom(atom);

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

  return {
    tokenCategories: tokenCategories?.results,

    preferredServicePointCategory:
      preferredServicePointCategory[subQueueId] != undefined && tokenCategories
        ? tokenCategories.results.find(
            (category) =>
              category.id === preferredServicePointCategory[subQueueId],
          )
        : undefined,

    setPreferredServicePointCategory: (categoryId: string | null) => {
      const updated = { ...preferredServicePointCategory };
      if (categoryId) {
        updated[subQueueId] = categoryId;
      } else {
        delete updated[subQueueId];
      }
      setPreferredServicePointCategory(updated);
    },
  } as const;
}

export { usePreferredServicePointCategory };
