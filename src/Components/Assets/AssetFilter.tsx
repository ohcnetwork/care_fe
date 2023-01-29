import { useState, useEffect, useCallback } from "react";
import { useAbortableEffect, statusType } from "../../Common/utils";
import { navigate, useQueryParams } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { useDispatch } from "react-redux";
import { getAnyFacility, getFacilityAssetLocation } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { LocationSelect } from "../Common/LocationSelect";
import { AssetClass, AssetLocationObject } from "./AssetTypes";
import FilterButtons from "../Common/FilterButtons";
import { FieldLabel } from "../Form/FormFields/FormField";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { SelectFormField } from "../Form/FormFields/SelectFormField";

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
  const [asset_class, setAssetClass] = useState<string>(
    filter.asset_class || ""
  );
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
      asset_class: asset_class,
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
          <CareIcon className="care-l-filter text-lg" />
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
            <SelectFormField
              id="asset-type"
              name="asset_type"
              options={[
                {
                  value: "EXTERNAL",
                  title: "EXTERNAL",
                },
                {
                  value: "INTERNAL",
                  title: "INTERNAL",
                },
              ]}
              optionLabel={({ title }) => title}
              optionValue={({ value }) => value}
              value={asset_type}
              onChange={({ value }) => setAssetType(value)}
            />
          </div>

          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Asset Status</FieldLabel>
            <SelectFormField
              id="asset-status"
              name="asset_status"
              options={[
                {
                  value: "ACTIVE",
                  title: "ACTIVE",
                },
                {
                  value: "TRANSFER_IN_PROGRESS",
                  title: "TRANSFER IN PROGRESS",
                },
              ]}
              optionLabel={({ title }) => title}
              optionValue={({ value }) => value}
              value={asset_status}
              onChange={({ value }) => setAssetStatus(value)}
            />
          </div>

          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Asset Class</FieldLabel>
            <SelectFormField
              id="asset-class"
              name="asset_class"
              options={[
                { title: "ONVIF Camera", value: AssetClass.ONVIF },
                {
                  title: "HL7 Vitals Monitor",
                  value: AssetClass.HL7MONITOR,
                },
              ]}
              optionLabel={({ title }) => title}
              optionValue={({ value }) => value}
              value={asset_class}
              onChange={({ value }) => setAssetClass(value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetFilter;
