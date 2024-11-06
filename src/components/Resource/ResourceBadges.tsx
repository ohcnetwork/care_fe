import { SHIFTING_FILTER_ORDER } from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export function useFacilityQuery(facilityId: string | undefined) {
  return useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId as string },
    prefetch: !!facilityId,
  });
}

export default function BadgesList(props: any) {
  const { appliedFilters, FilterBadges } = props;
  const originFacility = useFacilityQuery(appliedFilters.origin_facility);
  const approvingFacility = useFacilityQuery(appliedFilters.approving_facility);
  const assignedFacility = useFacilityQuery(appliedFilters.assigned_facility);

  const getDescShiftingFilterOrder = (ordering: any) => {
    const foundItem = SHIFTING_FILTER_ORDER.find(
      (item) => item.text === ordering,
    );
    return foundItem ? foundItem.desc : "";
  };

  return (
    <FilterBadges
      badges={({ badge, value, boolean, dateRange }: any) => [
        value(
          "Ordering",
          "ordering",
          getDescShiftingFilterOrder(appliedFilters.ordering),
        ),
        badge("Status", "status"),
        badge("Title", "title"),
        boolean("Emergency", "emergency", {
          trueValue: "yes",
          falseValue: "no",
        }),
        ...dateRange("Modified", "modified_date"),
        ...dateRange("Created", "created_date"),
        value(
          "Origin facility",
          "origin_facility",
          appliedFilters.origin_facility
            ? originFacility?.data?.name || ""
            : "",
        ),
        value(
          "Approving facility",
          "approving_facility",
          appliedFilters.approving_facility
            ? approvingFacility?.data?.name || ""
            : "",
        ),
        value(
          "Assigned facility",
          "assigned_facility",
          appliedFilters.assigned_facility
            ? assignedFacility?.data?.name || ""
            : "",
        ),
      ]}
    />
  );
}
