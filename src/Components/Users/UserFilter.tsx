import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getDistrict } from "../../Redux/actions";
import { navigate } from "raviger";
import DistrictSelect from "../Facility/FacilityFilter/DistrictSelect";
import parsePhoneNumberFromString from "libphonenumber-js";
import TextFormField from "../Form/FormFields/TextFormField";
import SelectMenuV2 from "../Form/SelectMenuV2";
import { FieldLabel } from "../Form/FormFields/FormField";
import { USER_TYPE_OPTIONS } from "../../Common/constants";
import useMergeState from "../../Common/hooks/useMergeState";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";

const parsePhoneNumberForFilterParam = (phoneNumber: string) => {
  if (!phoneNumber) return "";
  if (phoneNumber.startsWith("+"))
    return parsePhoneNumberFromString(phoneNumber)?.format("E.164") || "";
  return phoneNumber;
};

export default function UserFilter(props: any) {
  const { filter, onChange, closeFilter } = props;
  const dispatch: any = useDispatch();
  const [filterState, setFilterState] = useMergeState({
    first_name: filter.first_name || "",
    last_name: filter.last_name || "",
    phone_number: filter.phone_number || undefined,
    alt_phone_number: filter.alt_phone_number || undefined,
    user_type: filter.user_type || "",
    district_id: filter.district_id || "",
    district_ref: null,
  });

  const clearFilterState = {
    first_name: "",
    last_name: "",
    phone_number: undefined,
    alt_phone_number: undefined,
    user_type: "",
    district_id: "",
    district_ref: null,
  };

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

  return (
    <FiltersSlideover
      advancedFilter={props}
      onApply={applyFilter}
      onClear={() => {
        navigate("/users");
        setFilterState(clearFilterState);
        closeFilter();
      }}
    >
      <TextFormField
        label="First Name"
        labelClassName="text-sm"
        name="first_name"
        value={filterState.first_name}
        onChange={handleChange}
        errorClassName="hidden"
      />
      <TextFormField
        label="Last Name"
        labelClassName="text-sm"
        name="last_name"
        value={filterState.last_name}
        onChange={handleChange}
        errorClassName="hidden"
      />

      <div className="w-full flex-none">
        <FieldLabel>Role</FieldLabel>
        <SelectMenuV2
          id="role"
          placeholder="Show all"
          options={USER_TYPE_OPTIONS}
          optionLabel={(o) => o.role + ((o.readOnly && " (Read Only)") || "")}
          optionValue={(o) => o.id}
          value={filterState.user_type}
          onChange={(v) => setFilterState({ ...filterState, user_type: v })}
        />
      </div>

      <div className="w-full flex-none">
        <FieldLabel>District</FieldLabel>
        <DistrictSelect
          multiple={false}
          name="district"
          selected={filterState.district_ref}
          setSelected={setDistrict}
          errors={""}
        />
      </div>

      <PhoneNumberFormField
        label="Phone Number"
        name="phone_number"
        placeholder="Phone Number"
        value={filterState.phone_number}
        onChange={handleChange}
        errorClassName="hidden"
        types={["mobile", "landline"]}
      />

      <PhoneNumberFormField
        label="Whatsapp Number"
        name="alt_phone_number"
        placeholder="WhatsApp Phone Number"
        value={filterState.alt_phone_number}
        onChange={handleChange}
        errorClassName="hidden"
        types={["mobile"]}
      />
    </FiltersSlideover>
  );
}
