import { parsePhoneNumber } from "../../Utils/utils";
import TextFormField from "../Form/FormFields/TextFormField";
import SelectMenuV2 from "../Form/SelectMenuV2";
import { FieldLabel } from "../Form/FormFields/FormField";
import { USER_TYPE_OPTIONS } from "../../Common/constants";
import useMergeState from "../../Common/hooks/useMergeState";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";
import DistrictAutocompleteFormField from "../Common/DistrictAutocompleteFormField";
import StateAutocompleteFormField from "../Common/StateAutocompleteFormField";
import { useTranslation } from "react-i18next";
import * as Notify from "../../Utils/Notifications";

const parsePhoneNumberForFilterParam = (phoneNumber: string) => {
  if (!phoneNumber) return "";
  if (phoneNumber === "+91") return "";
  if (phoneNumber.startsWith("+")) return parsePhoneNumber(phoneNumber) ?? "";
  return phoneNumber;
};

export default function UserFilter(props: any) {
  const { t } = useTranslation();
  const { filter, onChange, closeFilter, removeFilters } = props;
  const [filterState, setFilterState] = useMergeState({
    first_name: filter.first_name || "",
    last_name: filter.last_name || "",
    phone_number: filter.phone_number || "+91",
    alt_phone_number: filter.alt_phone_number || "+91",
    user_type: filter.user_type || "",
    district: filter.district || "",
    state: filter.state || "",
  });

  const applyFilter = () => {
    const {
      first_name,
      last_name,
      phone_number,
      alt_phone_number,
      user_type,
      district,
      state,
    } = filterState;
    const data = {
      first_name: first_name || "",
      last_name: last_name || "",
      phone_number: parsePhoneNumberForFilterParam(phone_number),
      alt_phone_number: parsePhoneNumberForFilterParam(alt_phone_number),
      user_type: user_type || "",
      district: district || "",
      state: district ? state || "" : "",
    };
    if (state && !district) {
      Notify.Warn({
        msg: "District is required when state is selected",
      });
      return;
    }
    onChange(data);
  };

  const handleChange = ({ name, value }: any) => {
    if (name === "state" && !value)
      setFilterState({ ...filterState, state: value, district: undefined });
    else setFilterState({ ...filterState, [name]: value });
  };

  const field = (name: string) => ({
    name,
    label: t(name),
    value: filterState[name],
    onChange: handleChange,
  });

  return (
    <FiltersSlideover
      advancedFilter={props}
      onApply={applyFilter}
      onClear={() => {
        removeFilters();
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

      <StateAutocompleteFormField {...field("state")} errorClassName="hidden" />
      <DistrictAutocompleteFormField
        errorClassName="hidden"
        {...field("district")}
        state={filterState.state}
      />
      <div>
        <PhoneNumberFormField
          label="Phone Number"
          name="phone_number"
          placeholder="Phone Number"
          value={filterState.phone_number}
          onChange={handleChange}
          types={["mobile", "landline"]}
        />
      </div>
      <div className="-mb-4">
        <PhoneNumberFormField
          label="Whatsapp Number"
          name="alt_phone_number"
          placeholder="WhatsApp Phone Number"
          value={filterState.alt_phone_number}
          onChange={handleChange}
          types={["mobile"]}
        />
      </div>
    </FiltersSlideover>
  );
}
