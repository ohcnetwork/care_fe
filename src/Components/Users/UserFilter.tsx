import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getDistrict } from "../../Redux/actions";
import { PhoneNumberField } from "../Common/HelperInputFields";
import { navigate } from "raviger";
import DistrictSelect from "../Facility/FacilityFilter/DistrictSelect";
import parsePhoneNumberFromString from "libphonenumber-js";
import TextFormField from "../Form/FormFields/TextFormField";
import SelectMenuV2 from "../Form/SelectMenuV2";
import { FieldLabel } from "../Form/FormFields/FormField";
import { USER_TYPE_OPTIONS } from "../../Common/constants";
import FiltersSlideOver, {
  AdvancedFilterProps,
} from "../../CAREUI/shared/FiltersSlideOver";
import useMergeState from "../../Common/hooks/useMergeState";

const parsePhoneNumberForFilterParam = (phoneNumber: string) => {
  if (!phoneNumber) return "";
  return parsePhoneNumberFromString(phoneNumber)?.format("E.164") || "";
};

const clearFilterState = {
  first_name: "",
  last_name: "",
  phone_number: "",
  alt_phone_number: "",
  user_type: "",
  district_id: "",
  district_ref: null,
};

export default function UserFilter({
  filter,
  onChange,
  ...props
}: AdvancedFilterProps) {
  const dispatch: any = useDispatch();
  const [filterState, setFilterState] = useMergeState({
    first_name: filter.first_name || "",
    last_name: filter.last_name || "",
    phone_number: filter.phone_number || "",
    alt_phone_number: filter.alt_phone_number || "",
    user_type: filter.user_type || "",
    district_id: filter.district_id || "",
    district_ref: null,
  });

  const setDistrict = (selected: any) => {
    const filterData: any = { ...filterState };
    filterData["district_ref"] = selected;
    filterData["district_id"] = (selected || {}).id;
    setFilterState(filterData);
  };

  const applyFilter = () => {
    const {
      first_name,
      last_name,
      phone_number,
      alt_phone_number,
      user_type,
      district_id,
    } = filterState;
    const data = {
      first_name: first_name || "",
      last_name: last_name || "",
      phone_number: parsePhoneNumberForFilterParam(phone_number),
      alt_phone_number: parsePhoneNumberForFilterParam(alt_phone_number),
      user_type: user_type || "",
      district_id: district_id || "",
    };
    onChange(data);
  };

  useEffect(() => {
    async function fetchData() {
      if (filter.district_id) {
        const { data: districtData } = await dispatch(
          getDistrict(filter.district_id, "district")
        );
        setFilterState({ district_ref: districtData });
      }
    }
    fetchData();
  }, [dispatch]);

  const handleChange = ({ name, value }: any) =>
    setFilterState({ ...filterState, [name]: value });

  const clearFilter = () => {
    navigate("/users");
    setFilterState(clearFilterState);
  };

  return (
    <FiltersSlideOver onClear={clearFilter} onApply={applyFilter} {...props}>
      <TextFormField
        className="w-full"
        label="First Name"
        labelClassName="text-sm"
        name="first_name"
        value={filterState.first_name}
        onChange={handleChange}
        errorClassName="hidden"
      />
      <TextFormField
        className="w-full"
        label="Last Name"
        labelClassName="text-sm"
        name="last_name"
        value={filterState.last_name}
        onChange={handleChange}
        errorClassName="hidden"
      />

      <div className="w-full flex-none">
        <FieldLabel className="text-sm">Role</FieldLabel>
        <SelectMenuV2
          placeholder="Show all"
          options={USER_TYPE_OPTIONS}
          optionLabel={(o) => o.role + ((o.readOnly && " (Read Only)") || "")}
          optionValue={(o) => o.id}
          value={filterState.user_type}
          onChange={(v) => setFilterState({ ...filterState, user_type: v })}
        />
      </div>

      <div className="w-full flex-none">
        <FieldLabel className="text-sm">District</FieldLabel>
        <DistrictSelect
          multiple={false}
          name="district"
          selected={filterState.district_ref}
          setSelected={setDistrict}
          className="shifting-page-filter-dropdown"
          errors={""}
        />
      </div>

      <div className="flex flex-wrap">
        <div className="w-full flex-none">
          <FieldLabel className="text-sm">Phone Number</FieldLabel>
          <div className="flex justify-between">
            <div className="w-full">
              <PhoneNumberField
                placeholder="Phone Number"
                value={filterState.phone_number}
                onChange={(value: string) => {
                  handleChange({ name: "phone_number", value });
                }}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-none -mt-2">
          <FieldLabel className="text-sm">Whatsapp Number</FieldLabel>
          <div className="flex justify-between">
            <div className="w-full">
              <PhoneNumberField
                placeholder="WhatsApp Phone Number"
                value={filterState.alt_phone_number}
                onChange={(value: string) => {
                  handleChange({ name: "alt_phone_number", value });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </FiltersSlideOver>
  );
}
