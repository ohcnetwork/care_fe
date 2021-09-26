import React, { useState, useEffect } from "react";
import { KASP_STRING } from "../../Common/constants";
import { getUserList, getFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";

export default function BadgesList(props: any) {
  const { filterParams, appliedFilters, local, updateFilter } = props;

  const [assignedUsername, setAssignedUsername] = useState("");
  const [orginFacilityName, setOrginFacilityName] = useState("");
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.assigned_to || local.assigned_to) {
        const res = await dispatch(
          getUserList({ id: appliedFilters.assigned_to || local.assigned_to })
        );

        const { first_name, last_name } = res?.data?.results[0];
        setAssignedUsername(`${first_name} ${last_name}`);
      } else setAssignedUsername("");
    }
    fetchData();
  }, [dispatch, appliedFilters.assigned_to]);

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.orgin_facility || local.orgin_facility) {
        const res = await dispatch(
          getFacility(
            appliedFilters.orgin_facility || local.orgin_facility,
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

  const removeFilter = (paramKey: any) => {
    const localData: any = { ...local };
    const params = { ...filterParams };

    localData[paramKey] = "";
    params[paramKey] = "";

    if (paramKey === "assigned_to") {
      localData["assigned_user"] = "";
      localData["assigned_user_ref"] = "";

      params["assigned_user"] = "";
      // params["assigned_user_ref"] = "";
    } else if (
      paramKey === "assigned_facility" ||
      paramKey === "orgin_facility" ||
      paramKey === "shifting_approving_facility"
    ) {
      localData[`${paramKey}_ref`] = "";
      // params[`${paramKey}_ref`] = "";
    }
    updateFilter(params, localData);
  };
  const badge = (key: string, value: any, paramKey: any) => {
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
    <div className="flex flex-wrap space-x-2 mt-2 ml-2">
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
        `Is ${KASP_STRING}`,
        local.is_kasp === "yes" || appliedFilters.is_kasp === "true"
          ? "yes"
          : local.is_kasp === "no" || appliedFilters.is_kasp === "false"
          ? "no"
          : undefined,
        "is_kasp"
      )}
      {badge(
        "Up Shift",
        local.is_up_shift === "yes" || appliedFilters.is_up_shift === "true"
          ? "yes"
          : local.is_up_shift === "no" || appliedFilters.is_up_shift === "false"
          ? "no"
          : undefined,
        "is_up_shift"
      )}
      {badge(
        "Is Antenatal",
        local.is_antenatal === "yes" || appliedFilters.is_antenatal === "true"
          ? "yes"
          : local.is_antenatal === "no" ||
            appliedFilters.is_antenatal === "false"
          ? "no"
          : undefined,
        "is_antenatal"
      )}
      {badge(
        "Phone Number",
        appliedFilters.patient_phone_number || local.patient_phone_number,
        "patient_phone_number"
      )}
      {badge(
        "Patient Name",
        appliedFilters.patient_name || local.patient_name,
        "patient_name"
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
      {badge(
        "Disease Status",
        appliedFilters.disease_status || local.disease_status,
        "disease_status"
      )}
      {badge(
        "Breathlessness Level",
        appliedFilters.breathlessness_level || local.breathlessness_level,
        "breathlessness_level"
      )}

      {badge("Assigned To", assignedUsername, "assigned_to")}

      {badge("Origin Facility", orginFacilityName, "orgin_facility")}
      {badge(
        "Filtered By",
        (appliedFilters.assigned_facility || local.assigned_facility) &&
          "Assigned Facility",
        "assigned_facility"
      )}
      {badge(
        "Filtered By",
        (appliedFilters.shifting_approving_facility ||
          local.shifting_approving_facility) &&
          "Shifting Approving Facility",
        "shifting_approving_facility"
      )}
    </div>
  );
}
