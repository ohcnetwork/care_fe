import { useState, useEffect, useCallback } from "react";
import { navigate, useQueryParams } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { LocationSelect } from "../Common/LocationSelect";
import { AssetClass, AssetLocationObject } from "./AssetTypes";
import { FieldLabel } from "../Form/FormFields/FormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import DateRangeFormField from "../Form/FormFields/DateRangeFormField";
import dayjs from "dayjs";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { DateRange } from "../Common/DateRangeInputV2";
import { dateQueryString } from "../../Utils/utils";

const initialLocation = {
  id: "",
  name: "",
  description: "",
  facility: {
    id: "",
    name: "",
  },
};

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

function AssetFilter(props: any) {
  const { filter, onChange, closeFilter } = props;
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
  const [facilityId, setFacilityId] = useState<string | "">(filter.facility);
  const [locationId, setLocationId] = useState<string | "">(filter.location);
  const [warrantyExpiry, setWarrantyExpiry] = useState({
    before: filter.warranty_amc_end_of_validity_before || null,
    after: filter.warranty_amc_end_of_validity_after || null,
  });
  const [qParams, _] = useQueryParams();

  useQuery(routes.getPermittedFacility, {
    pathParams: { id: facilityId },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setFacility(data);
      }
    },
    prefetch: !!facilityId,
  });

  useQuery(routes.getFacilityAssetLocation, {
    pathParams: {
      facilityId: String(facilityId),
      locationId: String(locationId),
    },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setLocation(data);
      }
    },
    prefetch: !!(facilityId && locationId),
  });

  useEffect(() => {
    setFacilityId(facility?.id ? `${facility?.id}` : "");
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

  const applyFilter = () => {
    const data = {
      facility: facilityId,
      asset_type: asset_type ?? "",
      asset_class: asset_class ?? "",
      status: asset_status ?? "",
      location: locationId,
      warranty_amc_end_of_validity_before: dateQueryString(
        warrantyExpiry.before
      ),
      warranty_amc_end_of_validity_after: dateQueryString(warrantyExpiry.after),
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

  const handleDateRangeChange = (event: FieldChangeEvent<DateRange>) => {
    const state = { ...warrantyExpiry };
    state.after = event.value.start?.toString();
    state.before = event.value.end?.toString();
    setWarrantyExpiry(state);
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
            name="Facilities-location"
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

      <DateRangeFormField
        name="warranty_amc_end_of_validity"
        label="Warranty/AMC End of Validity"
        value={{
          start: getDate(warrantyExpiry.after),
          end: getDate(warrantyExpiry.before),
        }}
        onChange={handleDateRangeChange}
        errorClassName="hidden"
      />
    </FiltersSlideover>
  );
}

export default AssetFilter;
