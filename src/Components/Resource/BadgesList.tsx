import { SHIFTING_FILTER_ORDER } from "../../Common/constants";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";

function useFacilityQuery(facilityId: string | undefined) {
  return useQuery(routes.getAnyFacility, {
    pathParams: { id: String(facilityId) },
    prefetch: facilityId !== undefined,
  });
}

export default function BadgesList(props: any) {
  const { appliedFilters, FilterBadges } = props;
  const originFacilityData = useFacilityQuery(appliedFilters.origin_facility);
  const approvingFacilityData = useFacilityQuery(
    appliedFilters.approving_facility
  );
  const assignedFacilityData = useFacilityQuery(
    appliedFilters.assigned_facility
  );

  const getDescShiftingFilterOrder = (ordering: any) => {
    const foundItem = SHIFTING_FILTER_ORDER.find(
      (item) => item.text === ordering
    );
    return foundItem ? foundItem.desc : "";
  };

  return (
    <FilterBadges
      badges={({ badge, value, boolean, dateRange }: any) => [
        value(
          "Ordering",
          "ordering",
          getDescShiftingFilterOrder(appliedFilters.ordering)
        ),
        badge("Status", "status"),
        boolean("Emergency", "emergency", {
          trueValue: "yes",
          falseValue: "no",
        }),
        ...dateRange("Modified", "modified_date"),
        ...dateRange("Created", "created_date"),
        value(
          "Origin facility",
          "origin_facility",
          originFacilityData?.data?.name
        ),
        value(
          "Approving facility",
          "approving_facility",
          approvingFacilityData?.data?.name
        ),
        value(
          "Assigned facility",
          "assigned_facility",
          assignedFacilityData?.data?.name
        ),
      ]}
    />
  );
}
