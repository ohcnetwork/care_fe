import { useState, useEffect, useCallback } from "react";
import { navigate, useQueryParams } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { LocationSelect } from "../Common/LocationSelect";
import { AssetClass } from "./AssetTypes";
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

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

const initialFacilityState: FacilityModel = {
  id: undefined,
  name: "",
  read_cover_image_url: "",
  facility_type: "",
  address: "",
  features: [],
  location: {
    latitude: 0,
    longitude: 0,
  },
  oxygen_capacity: 0,
  phone_number: "",
  type_b_cylinders: 0,
  type_c_cylinders: 0,
  type_d_cylinders: 0,
  middleware_address: "",
  expected_type_b_cylinders: 0,
  expected_type_c_cylinders: 0,
  expected_type_d_cylinders: 0,
  expected_oxygen_requirement: 0,
  local_body_object: undefined,
  district_object: undefined,
  state_object: undefined,
  ward_object: undefined,
  modified_date: "",
  created_date: "",
  state: 0,
  district: 0,
  local_body: 0,
  ward: 0,
};

function AssetFilter(props: any) {
  const { filter, onChange, closeFilter } = props;
  const [facility, setFacility] = useState<FacilityModel>(initialFacilityState);
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
        const transformedData = {
          id: Number(data.id),
          name: data.name,
          read_cover_image_url: data.read_cover_image_url,
          facility_type: String(data.facility_type),
          address: data.address,
          features: data.features,
          location: {
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
          },
          oxygen_capacity: data.oxygen_capacity,
          phone_number: data.phone_number,
          type_b_cylinders: data.type_b_cylinders,
          type_c_cylinders: data.type_c_cylinders,
          type_d_cylinders: data.type_d_cylinders,
          middleware_address: data.middleware_address,
          expected_type_b_cylinders: data.expected_type_b_cylinders,
          expected_type_c_cylinders: data.expected_type_c_cylinders,
          expected_type_d_cylinders: data.expected_type_d_cylinders,
          expected_oxygen_requirement: data.expected_oxygen_requirement,
          local_body_object: data.local_body_object,
          district_object: data.district_object,
          state_object: data.state_object,
          ward_object: data.ward_object,
          modified_date: data.modified_date,
          created_date: data.created_date,
          state: data.state,
          district: data.district,
          local_body: data.local_body,
          ward: data.ward,
        };
        setFacility(transformedData);
      }
    },
    prefetch: !!facilityId,
  });

  useEffect(() => {
    setFacilityId(facility?.id ? `${facility?.id}` : "");
    setLocationId(
      facility?.id === qParams.facility ? qParams.location ?? "" : ""
    );
  }, [facility.id, qParams.facility, qParams.location]);

  const clearFilter = useCallback(() => {
    setFacility(initialFacilityState);
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
      location: locationId ?? "",
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
