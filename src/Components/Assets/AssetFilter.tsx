import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useAbortableEffect, statusType } from "../../Common/utils";
import { navigate, useQueryParams } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { useDispatch } from "react-redux";
import { getAnyFacility, getFacilityAssetLocation } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { LocationSelect } from "../Common/LocationSelect";
import { AssetLocationObject } from "./AssetTypes";
import { FieldLabel } from "../Form/FormFields/FormField";
import FiltersSlideOver from "../../CAREUI/shared/FiltersSlideOver";
import SelectMenuV2 from "../Form/SelectMenuV2";

const initialLocation = {
  id: "",
  name: "",
  description: "",
  facility: {
    id: "",
    name: "",
  },
};

type SelectMenuV2Option = { id: string; label: string; icon: string };

const AssetTypeOptions = [
  {
    id: "EXTERNAL",
    label: "External",
    icon: "uil uil-arrow-up-right",
  },
  {
    id: "INTERNAL",
    label: "Internal",
    icon: "uil uil-arrow-down-right",
  },
];

const AssetStatusOptions = [
  {
    id: "ACTIVE",
    label: "Active",
    icon: "uil uil-check",
  },
  {
    id: "TRANSFER_IN_PROGRESS",
    label: "Transfer in progress",
    icon: "uil uil-truck",
  },
];

const selectMenuV2Options = (options: SelectMenuV2Option[]) => {
  return {
    options,
    optionLabel: (o: SelectMenuV2Option) => o.label,
    optionIcon: (o: SelectMenuV2Option) => (
      <i className={o.icon + " text-lg"} />
    ),
    optionValue: (o: SelectMenuV2Option) => o.id,
  };
};

function AssetFilter(props: any) {
  const { filter, onChange, closeFilter } = props;
  const dispatch: any = useDispatch();
  const [facility, setFacility] = useState<FacilityModel>({ name: "" });
  const [location, setLocation] =
    useState<AssetLocationObject>(initialLocation);
  const [asset_type, setAssetType] = useState<string>(
    filter.asset_type ? filter.asset_type : ""
  );
  const [asset_status, setAssetStatus] = useState<string>(filter.status || "");
  const [facilityId, setFacilityId] = useState<number | "">(filter.facility);
  const [locationId, setLocationId] = useState<string | "">(filter.location);
  const [qParams, _] = useQueryParams();

  useEffect(() => {
    console.log(facility);
    setFacilityId(facility?.id ? facility?.id : "");
    setLocationId(location?.id ? location?.id : "");
  }, [facility, location]);

  const clearFilter = useCallback(() => {
    closeFilter();
    const searchQuery = qParams?.search && `?search=${qParams?.search}`;
    if (searchQuery) navigate(`/assets${searchQuery}`);
    else navigate("/assets");
  }, [qParams]);

  const fetchFacility = useCallback(
    async (status: statusType) => {
      if (facilityId) {
        const [facilityData]: any = await Promise.all([
          dispatch(getAnyFacility(facilityId)),
        ]);
        if (!status.aborted) {
          if (!facilityData?.data)
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

  const fetchLocation = useCallback(
    async (status: statusType) => {
      if (locationId && facilityId) {
        const [locationData]: any = await Promise.all([
          dispatch(
            getFacilityAssetLocation(String(facilityId), String(locationId))
          ),
        ]);
        if (!status.aborted) {
          if (!locationData.data)
            Notification.Error({
              msg: "Something went wrong..!",
            });
          else {
            setLocation(locationData.data);
          }
        }
      }
    },
    [filter.location]
  );

  useAbortableEffect((status: statusType) => {
    filter.facility && fetchFacility(status);
    filter.location && fetchLocation(status);
  }, []);
  const applyFilter = () => {
    const data = {
      facility: facilityId,
      asset_type: asset_type,
      status: asset_status,
      location: locationId,
    };
    onChange(data);
  };

  const handleFacilitySelect = (selected: FacilityModel) => {
    setFacility(selected ? selected : { name: "" });
  };
  const handleLocationSelect = (selected: AssetLocationObject) => {
    setLocation(selected ? selected : initialLocation);
  };

  return (
    <FiltersSlideOver
      open={props.show}
      setOpen={props.setShow}
      onClear={clearFilter}
      onApply={applyFilter}
    >
      <div className="flex flex-col gap-4">
        <div className="w-full flex-none">
          <FieldLabel className="text-sm">Facility</FieldLabel>
          <FacilitySelect
            name="Facilities"
            setSelected={(selected) =>
              handleFacilitySelect(selected as FacilityModel)
            }
            selected={facility}
            errors=""
            showAll
            multiple={false}
          />
        </div>

        {facilityId && (
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Location</FieldLabel>
            <LocationSelect
              name="Facilities"
              setSelected={(selected) =>
                handleLocationSelect(selected as AssetLocationObject)
              }
              selected={location}
              errors=""
              showAll={false}
              multiple={false}
              facilityId={facilityId}
            />
          </div>
        )}

        <div className="w-full flex-none">
          <FieldLabel className="text-sm">Asset Type</FieldLabel>
          <SelectMenuV2
            placeholder="Filter by Asset type"
            {...selectMenuV2Options(AssetTypeOptions)}
            value={asset_type}
            onChange={(o) => setAssetType(o || "")}
          />
        </div>

        <div className="w-full flex-none">
          <FieldLabel className="text-sm">Asset Status</FieldLabel>
          <SelectMenuV2
            placeholder="Filter by Asset status"
            {...selectMenuV2Options(AssetStatusOptions)}
            value={asset_status}
            onChange={(o) => setAssetStatus(o || "")}
          />
        </div>
      </div>
    </FiltersSlideOver>
  );
}

export default AssetFilter;
