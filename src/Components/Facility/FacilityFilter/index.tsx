import { navigate } from "raviger";
import { FACILITY_TYPES } from "../../../Common/constants";
import useMergeState from "../../../Common/hooks/useMergeState";
import useConfig from "../../../Common/hooks/useConfig";
import FiltersSlideover from "../../../CAREUI/interactive/FiltersSlideover";
import { useTranslation } from "react-i18next";
import StateAutocompleteFormField from "../../Common/StateAutocompleteFormField";
import { FieldChangeEvent } from "../../Form/FormFields/Utils";
import DistrictAutocompleteFormField from "../../Common/DistrictAutocompleteFormField";
import LocalBodyAutocompleteFormField from "../../Common/LocalBodyAutocompleteFormField";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";

const clearFilterState = {
  state: "",
  district: "",
  local_body: "",
  facility_type: "",
  kasp_empanelled: "",
};

function FacilityFilter(props: any) {
  const { t } = useTranslation();
  const { filter, onChange, closeFilter } = props;
  const { kasp_string } = useConfig();
  const [filterState, setFilterState] = useMergeState({
    state: filter.state || "",
    district: filter.district || "",
    local_body: filter.local_body || "",
    facility_type: filter.facility_type || "",
    kasp_empanelled: filter.kasp_empanelled || "",
  });

  const applyFilter = () => {
    const data = {
      state: Number(filterState.state) || "",
      district: Number(filterState.district) || "",
      local_body: Number(filterState.local_body) || "",
      facility_type: filterState.facility_type || "",
      kasp_empanelled: filterState.kasp_empanelled || "",
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
        navigate("/facility");
        setFilterState(clearFilterState);
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
        <SelectFormField
          {...field("kasp_empanelled")}
          label={`${kasp_string} Empanelled`}
          options={[
            { id: "true", text: t("yes") },
            { id: "false", text: t("no") },
          ]}
          optionLabel={(option) => option.text}
          optionValue={(option) => option.id}
          placeholder={t("show_all")}
        />
      </div>
    </FiltersSlideover>
  );
}

export default FacilityFilter;
