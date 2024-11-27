import { useTranslation } from "react-i18next";

import FiltersSlideover from "@/CAREUI/interactive/FiltersSlideover";

import DistrictAutocompleteFormField from "@/components/Common/DistrictAutocompleteFormField";
import LocalBodyAutocompleteFormField from "@/components/Common/LocalBodyAutocompleteFormField";
import StateAutocompleteFormField from "@/components/Common/StateAutocompleteFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useMergeState from "@/hooks/useMergeState";

import { FACILITY_TYPES } from "@/common/constants";

function FacilityFilter(props: any) {
  const { t } = useTranslation();
  const { filter, onChange, closeFilter, removeFilters } = props;

  const [filterState, setFilterState] = useMergeState({
    state: filter.state || "",
    district: filter.district || "",
    local_body: filter.local_body || "",
    facility_type: filter.facility_type || "",
  });

  const applyFilter = () => {
    const data = {
      state: Number(filterState.state) || "",
      district: Number(filterState.district) || "",
      local_body: Number(filterState.local_body) || "",
      facility_type: filterState.facility_type || "",
    };
    onChange(data);
  };

  const handleChange = ({ name, value }: FieldChangeEvent<unknown>) => {
    const filterData = { ...filterState };

    if (name === "state") {
      filterData["district"] = 0;
      filterData["local_body"] = 0;
    }

    if (name === "district") {
      filterData["local_body"] = 0;
    }

    filterData[name] = value;

    setFilterState(filterData);
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
      <div className="w-full flex-none">
        <StateAutocompleteFormField {...field("state")} />
        <DistrictAutocompleteFormField
          {...field("district")}
          state={filterState.state}
        />
        <LocalBodyAutocompleteFormField
          {...field("local_body")}
          district={filterState.district}
        />
        <SelectFormField
          {...field("facility_type")}
          options={FACILITY_TYPES}
          optionLabel={(option) => option.text}
          optionValue={(option) => option.id}
          placeholder={t("show_all")}
        />
      </div>
    </FiltersSlideover>
  );
}

export default FacilityFilter;
