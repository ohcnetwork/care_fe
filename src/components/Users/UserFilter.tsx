import { useTranslation } from "react-i18next";

import FiltersSlideover from "@/CAREUI/interactive/FiltersSlideover";

import DistrictAutocompleteFormField from "@/components/Common/DistrictAutocompleteFormField";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import StateAutocompleteFormField from "@/components/Common/StateAutocompleteFormField";
import { FacilityModel } from "@/components/Facility/models";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import SelectMenuV2 from "@/components/Form/SelectMenuV2";

import useMergeState from "@/hooks/useMergeState";

import {
  USER_LAST_ACTIVE_OPTIONS,
  USER_TYPE_OPTIONS,
} from "@/common/constants";

import * as Notify from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { parsePhoneNumber } from "@/Utils/utils";

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
    home_facility: filter.home_facility || "",
    home_facility_ref: null,
    last_active_days: filter.last_active_days || "",
  });

  useQuery(routes.getAnyFacility, {
    pathParams: { id: filter.home_facility },
    prefetch: !!filter.home_facility && filter.home_facility !== "NONE",
    onResponse: ({ data }) => setFilterState({ home_facility_ref: data }),
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
      home_facility,
      last_active_days,
    } = filterState;
    const data = {
      first_name: first_name || "",
      last_name: last_name || "",
      phone_number: parsePhoneNumberForFilterParam(phone_number),
      alt_phone_number: parsePhoneNumberForFilterParam(alt_phone_number),
      user_type: user_type || "",
      district: district || "",
      state: district ? state || "" : "",
      home_facility: home_facility || "",
      last_active_days: last_active_days || "",
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

      <div className="w-full flex-none">
        <FieldLabel>Home Facility</FieldLabel>
        <FacilitySelect
          allowNone
          name="home_facility"
          setSelected={(selected) =>
            setFilterState({
              ...filterState,
              home_facility: (selected as FacilityModel)?.id || "",
              home_facility_ref: selected,
            })
          }
          selected={
            filterState.home_facility === "NONE"
              ? { name: t("no_home_facility"), id: "NONE" }
              : filterState.home_facility_ref
          }
          errors=""
          multiple={false}
        />
      </div>

      <div className="w-full flex-none">
        <FieldLabel>Active in last...</FieldLabel>
        <SelectMenuV2
          id="last_active_days"
          placeholder="Anytime"
          options={USER_LAST_ACTIVE_OPTIONS}
          optionLabel={(o) => o.text}
          optionValue={(o) => o.id}
          value={filterState.last_active_days}
          onChange={(v) =>
            setFilterState({ ...filterState, last_active_days: v })
          }
        />
      </div>

      <StateAutocompleteFormField {...field("state")} errorClassName="hidden" />
      <DistrictAutocompleteFormField
        errorClassName="hidden"
        {...field("district")}
        state={filterState.state}
      />
      <div className="-mb-4">
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
