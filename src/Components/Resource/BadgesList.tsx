import React, { useState, useEffect } from "react";
import { getFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";

export default function BadgesList(props: any) {
  const { appliedFilters, updateFilter } = props;

  const [orginFacilityName, setOrginFacilityName] = useState("");
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.orgin_facility) {
        const res = await dispatch(
          getFacility(appliedFilters.orgin_facility, "orgin_facility")
        );

        setOrginFacilityName(res?.data?.name);
      } else {
        setOrginFacilityName("");
      }
    }
    fetchData();
  }, [dispatch, appliedFilters.orgin_facility]);

  const removeFilter = (paramKey: any) => {
    const params = { ...appliedFilters };
    params[paramKey] = "";
    updateFilter(params);
  };

  const badge = (key: string, value: any, paramKey: string) => {
    return (
      value && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
          {key}
          {": "}
          {value}
          <i
            className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
            onClick={(e) => removeFilter(paramKey)}
          ></i>
        </span>
      )
    );
  };

  return (
    <div className="flex flex-wrap space-x-2 mt-2 ml-2 space-y-1">
      {badge("Ordering", appliedFilters.ordering, "ordering")}
      {badge(
        "status",
        appliedFilters.status != "--" && appliedFilters.status,
        "status"
      )}
      {badge(
        "Emergency",
        appliedFilters.emergency === "true"
          ? "yes"
          : appliedFilters.emergency === "false"
          ? "no"
          : undefined,
        "emergency"
      )}
      {badge(
        "Modified After",
        appliedFilters.modified_date_after,
        "modified_date_after"
      )}
      {badge(
        "Modified Before",
        appliedFilters.modified_date_before,
        "modified_date_before"
      )}
      {badge(
        "Created Before",
        appliedFilters.created_date_before,
        "created_date_before"
      )}
      {badge(
        "Created After",
        appliedFilters.created_date_after,
        "created_date_after"
      )}
      {badge(
        "Filtered By",
        appliedFilters.assigned_facility && "Assigned Facility",
        "assigned_facility"
      )}
      {badge("Origin Facility", orginFacilityName, "orgin_facility")}
      {badge(
        "Filtered By",
        appliedFilters.approving_facility && "Resource Approving Facility",
        "approving_facility"
      )}
    </div>
  );
}
