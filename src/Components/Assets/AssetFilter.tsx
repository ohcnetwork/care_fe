import { useState, useEffect, useCallback } from "react";
import { useAbortableEffect, statusType } from "../../Common/utils";
import { navigate, useQueryParams } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { useDispatch } from "react-redux";
import {
  getFacilityAssetLocation,
  getPermittedFacility,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { LocationSelect } from "../Common/LocationSelect";
import { AssetClass, AssetLocationObject } from "./AssetTypes";
import { FieldLabel } from "../Form/FormFields/FormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";

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
    setFacilityId(facility?.id ? facility?.id : "");
    setLocationId(
      facility?.id === qParams.facility ? qParams.location ?? "" : ""
    );
  }, [facility, location]);

  const clearFilter = useCallback(() => {
    setLocation(initialLocation);
    setFacility({ name: "" });
    setAssetType("");
    setAssetStatus("");
    setAssetClass("");
    setFacilityId("");
    setLocationId("");
    closeFilter();
    const searchQuery = qParams?.search && `?search=${qParams?.search}`;
    if (searchQuery) navigate(`/assets${searchQuery}`);
    else navigate("/assets");
  }, [qParams]);

  const fetchFacility = useCallback(
    async (status: statusType) => {
      if (facilityId) {
        const facilityData: any = await dispatch(
          getPermittedFacility(facilityId)
        );
        if (!status.aborted) {
          setFacility(facilityData?.data);
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
        if (!status.aborted && locationData !== undefined) {
          if (!locationData.data)
            Notification.Error({
              msg: "Something went wrong..!",
            });
          else {
            setLocation(locationData.data);
          }
        }
      } else {
        setLocation(initialLocation);
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
    setFacility(selected ? selected : facility);
    handleLocationSelect("");
  };
  const handleLocationSelect = (selectedId: string) => {
    setLocationId(selectedId);
  };

  return (
    <FiltersSlideover
      advancedFilter={props}
      onClear={clearFilter}
      onApply={applyFilter}
    >
      <div className="w-full flex-none">
        <FieldLabel>Facility</FieldLabel>
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
          <FieldLabel>Location</FieldLabel>
          <LocationSelect
            name="Facilities"
            setSelected={(selectedId) =>
              handleLocationSelect((selectedId as string) || "")
            }
            selected={locationId}
            errors=""
            showAll={false}
            multiple={false}
            facilityId={facilityId}
          />
        </div>
      )}

      <SelectFormField
        label="Asset Type"
        errorClassName="hidden"
        id="asset-type"
        name="asset_type"
        options={["EXTERNAL", "INTERNAL"]}
        optionLabel={(o) => o}
        optionValue={(o) => o}
        value={asset_type}
        onChange={({ value }) => setAssetType(value)}
      />

      <SelectFormField
        id="asset-status"
        name="asset_status"
        label="Asset Status"
        errorClassName="hidden"
        options={["ACTIVE", "TRANSFER_IN_PROGRESS"]}
        optionLabel={(o) => o.replace(/_/g, " ")}
        optionValue={(o) => o}
        value={asset_status}
        onChange={({ value }) => setAssetStatus(value)}
      />

      <SelectFormField
        id="asset-class"
        name="asset_class"
        label="Asset Class"
        errorClassName="hidden"
        options={[
          { title: "ONVIF Camera", value: AssetClass.ONVIF },
          {
            title: "HL7 Vitals Monitor",
            value: AssetClass.HL7MONITOR,
          },
          { title: "Ventilator", value: AssetClass.VENTILATOR },
        ]}
        optionLabel={({ title }) => title}
        optionValue={({ value }) => value}
        value={asset_class}
        onChange={({ value }) => setAssetClass(value)}
      />
    </FiltersSlideover>
  );
}

export default AssetFilter;
