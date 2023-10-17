/* eslint-disable react-hooks/rules-of-hooks */
import { SHIFTING_FILTER_ORDER } from "../../Common/constants";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";

export default function BadgesList(props: any) {
  const { appliedFilters, FilterBadges } = props;

  const originFacilityData =
    appliedFilters.origin_facility &&
    useQueryHook(appliedFilters.origin_facility);
  const approvingFacilityData =
    appliedFilters.approving_facility &&
    useQueryHook(appliedFilters.approving_facility);
  const assignedFacilityData =
    appliedFilters.assigned_facility &&
    useQueryHook(appliedFilters.assigned_facility);

  function useQueryHook(facilityId: any) {
    const { data } = useQuery(routes.getAnyFacility, {
      pathParams: { id: facilityId },
    });
    return { data };
  }

  const getDescShiftingFilterOrder = (ordering: any) => {
    let desc = "";
    SHIFTING_FILTER_ORDER.forEach((item) => {
      if (item.text === ordering) {
        desc = item.desc!;
      }
    });
    return desc;
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
