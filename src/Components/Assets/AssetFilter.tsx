import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useAbortableEffect, statusType } from "../../Common/utils";
import { navigate, useQueryParams } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { useDispatch } from "react-redux";
import { getAnyFacility, getFacilityAssetLocation } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { SelectField } from "../Common/HelperInputFields";
import { LocationSelect } from "../Common/LocationSelect";
import { AssetLocationObject } from "./AssetTypes";
import FilterButtons from "../Common/FilterButtons";
import { FieldLabel } from "../Form/FormFields/FormField";
import CareIcon from "../../CAREUI/icons/CareIcon";

const initialLocation = {
  id: "",
  name: "",
  description: "",
  facility: {
    id: "",
    name: "",
  },
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
    <div>
      <FilterButtons
        onClose={closeFilter}
        onClear={clearFilter}
        onApply={applyFilter}
      />
      <div className="w-full flex-none pt-14">
        <div className="text-md my-6 flex items-center text-gray-700 gap-2">
          <CareIcon className="care-l-filter h-5" />
          <p>Filter by</p>
        </div>

        <div className="flex flex-wrap gap-4">
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
            <SelectField
              id="asset-type"
              fullWidth
              name="asset_type"
              placeholder=""
              variant="outlined"
              margin="dense"
              options={[
                {
                  id: "",
                  name: "Select",
                },
                {
                  id: "EXTERNAL",
                  name: "EXTERNAL",
                },
                {
                  id: "INTERNAL",
                  name: "INTERNAL",
                },
              ]}
              optionValue="name"
              value={asset_type}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAssetType(e.target.value)
              }
            />
          </div>

          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Asset Status</FieldLabel>
            <SelectField
              id="asset-status"
              fullWidth
              name="asset_status"
              placeholder=""
              variant="outlined"
              margin="dense"
              options={[
                {
                  id: "",
                  name: "Select",
                },
                {
                  id: "ACTIVE",
                  name: "ACTIVE",
                },
                {
                  id: "TRANSFER_IN_PROGRESS",
                  name: "TRANSFER IN PROGRESS",
                },
              ]}
              optionValue="name"
              value={asset_status}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAssetStatus(e.target.value)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetFilter;
