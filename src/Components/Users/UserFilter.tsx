import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getDistrict } from "../../Redux/actions";
import { PhoneNumberField } from "../Common/HelperInputFields";
import { navigate } from "raviger";
import DistrictSelect from "../Facility/FacilityFilter/DistrictSelect";
import parsePhoneNumberFromString from "libphonenumber-js";
import FilterButtons from "../Common/FilterButtons";
import TextFormField from "../Form/FormFields/TextFormField";
import SelectMenuV2 from "../Form/SelectMenuV2";
import { FieldLabel } from "../Form/FormFields/FormField";
import { USER_TYPE_OPTIONS } from "../../Common/constants";

const useMergeState = (initialState: any) => {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) =>
    setState((prevState: any) => Object.assign({}, prevState, newState));
  return [state, setMergedState];
};

export default function UserFilter(props: any) {
  const { filter, onChange, closeFilter } = props;
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

  const clearFilterState = {
    first_name: "",
    last_name: "",
    phone_number: "",
    alt_phone_number: "",
    user_type: "",
    district_id: "",
    district_ref: null,
  };

  const handleChange = (event: any) => {
    const { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
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
      phone_number: phone_number
        ? parsePhoneNumberFromString(phone_number)?.format("E.164")
        : "",
      alt_phone_number: alt_phone_number
        ? parsePhoneNumberFromString(alt_phone_number)?.format("E.164")
        : "",
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

  const handleChangeV2 = ({ name, value }: any) =>
    setFilterState({ ...filterState, [name]: value });

  return (
    <div className="pb-10 -mt-4">
      <FilterButtons
        onClose={closeFilter}
        onApply={applyFilter}
        onClear={() => {
          navigate("/users");
          setFilterState(clearFilterState);
        }}
      />

      <div className="pt-20 text-md my-6 flex items-center text-gray-700 gap-2">
        <i className="fa-solid fa-filter" />
        <p>Filter by</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <TextFormField
          className="w-full"
          label="First Name"
          labelClassName="text-sm"
          name="first_name"
          value={filterState.first_name}
          onChange={handleChangeV2}
          errorClassName="hidden"
        />
        <TextFormField
          className="w-full"
          label="Last Name"
          labelClassName="text-sm"
          name="last_name"
          value={filterState.last_name}
          onChange={handleChangeV2}
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

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">Phone Number</span>
          <div className="flex justify-between">
            <div className="w-full">
              <PhoneNumberField
                placeholder="Phone Number"
                value={filterState.phone_number}
                onChange={(value: string) => {
                  handleChange({ target: { name: "phone_number", value } });
                }}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">WhatsApp Phone Number</span>
          <div className="flex justify-between">
            <div className="w-full">
              <PhoneNumberField
                placeholder="WhatsApp Phone Number"
                value={filterState.alt_phone_number}
                onChange={(value: string) => {
                  handleChange({ target: { name: "alt_phone_number", value } });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
