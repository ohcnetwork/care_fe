import React, { useState, useEffect } from "react";
import { getAnyFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { Link } from "raviger";

export default function BadgesList(props: any) {
  const { appliedFilters, updateFilter, local } = props;

  const [orginFacilityName, setOrginFacilityName] = useState("");
  const [approvingFacilityName, setApprovingFacilityName] = useState("");
  const [assignedFacilityName, setAssignedFacilityName] = useState("");
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.orgin_facility || local.origin_facility) {
        const res = await dispatch(
          getAnyFacility(
            appliedFilters.orgin_facility || local.origin_facility,
            "orgin_facility"
          )
        );

        setOrginFacilityName(res?.data?.name);
      } else {
        setOrginFacilityName("");
      }
    }
    fetchData();
  }, [dispatch, appliedFilters.orgin_facility]);

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.approving_facility || local.approving_facility) {
        const res = await dispatch(
          getAnyFacility(
            appliedFilters.approving_facility || local.approving_facility,
            "approving_facility"
          )
        );

        setApprovingFacilityName(res?.data?.name);
      } else {
        setApprovingFacilityName("");
      }
    }
    fetchData();
  }, [dispatch, appliedFilters.approving_facility]);

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.assigned_facility || local.assigned_facility) {
        const res = await dispatch(
          getAnyFacility(
            appliedFilters.assigned_facility || local.assigned_facility,
            "assigned_facility"
          )
        );

        setAssignedFacilityName(res?.data?.name);
      } else {
        setAssignedFacilityName("");
      }
    }
    fetchData();
  }, [dispatch, appliedFilters.assigned_facility]);

  const filtersExists = () => {
    let { limit, offset, ...rest } = appliedFilters;

    return Object.values(rest).some((value) => value);
  };

  const removeFilter = (paramKey: any) => {
    const localData: any = { ...local };
    const params = { ...appliedFilters };

    localData[paramKey] = "";
    params[paramKey] = "";
    updateFilter(params, localData);
  };

  const badge = (key: string, value: any, paramKey: string) => {
    return (
      value && (
        <span className="inline-flex items-center px-3 py-1 mt-2 ml-2 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
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
    <div className="flex flex-wrap mt-4 ml-2">
      {badge("Ordering", appliedFilters.ordering || local.ordering, "ordering")}
      {badge(
        "status",
        (appliedFilters.status != "--" && appliedFilters.status) ||
          (local.status !== "--" && local.status),
        "status"
      )}
      {badge(
        "Emergency",
        local.emergency === "yes" || appliedFilters.emergency === "true"
          ? "yes"
          : local.emergency === "no" || appliedFilters.emergency === "false"
          ? "no"
          : undefined,
        "emergency"
      )}
      {badge(
        "Modified After",
        appliedFilters.modified_date_after || local.modified_date_after,
        "modified_date_after"
      )}
      {badge(
        "Modified Before",
        appliedFilters.modified_date_before || local.modified_date_before,
        "modified_date_before"
      )}
      {badge(
        "Created Before",
        appliedFilters.created_date_before || local.created_date_before,
        "created_date_before"
      )}
      {badge(
        "Created After",
        appliedFilters.created_date_after || local.created_date_after,
        "created_date_after"
      )}
      {badge("Origin Facility", orginFacilityName, "orgin_facility")}
      {badge("Approving Facility", approvingFacilityName, "approving_facility")}
      {badge("Assigned Facility", assignedFacilityName, "assigned_facility")}

      {filtersExists() && (
        <Link
          href="/resource"
          className="inline-flex items-center px-3 py-1 mt-2 ml-2 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border cursor-pointer hover:border-gray-700 hover:text-gray-900"
        >
          <i className="fas fa-minus-circle fa-lg mr-1.5"></i>
          <span>Clear All Filters</span>
        </Link>
      )}
    </div>
  );
}
