import { useState, useEffect, useCallback } from "react";
import { useAbortableEffect, statusType } from "../../Common/utils";
import { navigate, useQueryParams } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { useDispatch } from "react-redux";
import { getFacility, getFacilityAssetLocation } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { SelectField } from "../Common/HelperInputFields";
import { LocationSelect } from "../Common/LocationSelect";
import { AssetLocationObject } from "./AssetTypes";

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
  let { filter, onChange, closeFilter } = props;
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

  const handleClearFilter = useCallback(() => {
    closeFilter();
    const searchQuery = qParams?.search && `?search=${qParams?.search}`;
    if (searchQuery) navigate(`/assets${searchQuery}`);
    else navigate(`/assets`);
  }, [qParams]);

  const fetchFacility = useCallback(
    async (status: statusType) => {
      if (facilityId) {
        const [facilityData]: any = await Promise.all([
          dispatch(getFacility(facilityId)),
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
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />
          Cancel
        </button>
        <button className="btn btn-default" onClick={handleClearFilter}>
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
        {facilityId && (
          <div className="w-64 flex-none">
            <span className="text-sm font-semibold">Location</span>
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
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Asset Type</span>
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

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Asset Status</span>
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
  );
}

export default AssetFilter;
