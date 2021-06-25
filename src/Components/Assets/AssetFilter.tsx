import React, { useState, useEffect, useCallback } from "react";
import { useAbortableEffect, statusType } from "../../Common/utils";
import { navigate } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { useDispatch } from "react-redux";
import { getFacility } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";

function AssetFilter(props: any) {
  let { filter, onChange, closeFilter } = props;
  const dispatch: any = useDispatch();
  const [facility, setFacility] = useState<FacilityModel>({ name: "" });
  const [facilityId, setFacilityId] = useState<number | "">(filter.facility);

  useEffect(() => {
    if (facility?.id) setFacilityId(facility?.id);
    else setFacilityId("");
  }, [facility]);

  const fetchFacility = useCallback(
    async (status: statusType) => {
      if (facilityId !== "") {
        const [facilityData]: any = await Promise.all([
          dispatch(getFacility(facilityId)),
        ]);
        if (!status.aborted) {
          if (!facilityData.data)
            Notification.Error({
              msg: "Something went wrong..!",
            });
          else {
            setFacility(facilityData.data);
          }
        }
      }
    },
    [filter.facility]
  );

  useAbortableEffect((status: statusType) => {
    if (filter.facility) {
      fetchFacility(status);
    }
  }, []);
  const applyFilter = () => {
    const data = {
      facility: facilityId,
    };
    onChange(data);
  };

  const handleFacilitySelect = (selected: FacilityModel) => {
    if (selected) setFacility(selected);
    else {
      setFacility({ name: "" });
    }
  };

  return (
    <div>
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />
          Cancel
        </button>
        <button
          className="btn btn-default"
          onClick={(_) => {
            closeFilter();
            navigate("/assets");
          }}
        >
          <i className="fas fa-times mr-2" />
          Clear Filter
        </button>
        <button className="btn btn-primary" onClick={applyFilter}>
          <i className="fas fa-check mr-2" />
          Apply
        </button>
      </div>
      <div className="w-64 flex-none mt-2">
        <div className="font-light text-md mt-2">Filter By:</div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Facility</span>
          <FacilitySelect
            name="Facilities"
            setSelected={(selected) =>
              handleFacilitySelect(selected as FacilityModel)
            }
            selected={facility}
            errors=""
            showAll={false}
            multiple={false}
          />
        </div>
      </div>
    </div>
  );
}

export default AssetFilter;
