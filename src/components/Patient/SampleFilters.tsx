import FiltersSlideover from "@/CAREUI/interactive/FiltersSlideover";

import CircularProgress from "@/components/Common/CircularProgress";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import { FacilityModel } from "@/components/Facility/models";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useMergeState from "@/hooks/useMergeState";

import {
  SAMPLE_TEST_RESULT,
  SAMPLE_TEST_STATUS,
  SAMPLE_TYPE_CHOICES,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export default function UserFilter(props: any) {
  const { filter, onChange, closeFilter, removeFilters } = props;

  const [filterState, setFilterState] = useMergeState({
    status: filter.status || "",
    result: filter.result || "",
    facility: filter.facility || "",
    facility_ref: filter.facility_ref || null,
    sample_type: filter.sample_type || "",
  });

  const handleChange = ({ name, value }: FieldChangeEvent<unknown>) => {
    setFilterState({ ...filterState, [name]: value });
  };

  const applyFilter = () => {
    const { status, result, facility, sample_type } = filterState;
    const data = {
      status: status || "",
      result: result || "",
      facility: facility || "",
      sample_type: sample_type || "",
    };
    onChange(data);
  };

  const { loading: isFacilityLoading } = useQuery(routes.getAnyFacility, {
    pathParams: {
      id: filter.facility,
    },
    prefetch: !!filter.facility,
    onResponse: ({ data }) => {
      setFilterState({ ...filterState, facility_ref: data });
    },
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
      <SelectFormField
        name="status"
        label="Status"
        value={filterState.status}
        onChange={handleChange}
        options={SAMPLE_TEST_STATUS.map(({ id, text }) => {
          return { id, text: text.replaceAll("_", " ") };
        })}
        optionValue={(option) => option.id}
        optionLabel={(option) => option.text}
        labelClassName="text-sm"
        errorClassName="hidden"
      />

      <SelectFormField
        name="result"
        label="Result"
        value={filterState.result}
        onChange={handleChange}
        options={SAMPLE_TEST_RESULT}
        optionValue={(option) => option.id}
        optionLabel={(option) => option.text}
        labelClassName="text-sm"
        errorClassName="hidden"
      />

      <SelectFormField
        name="sample_type"
        label="Sample Test Type"
        value={filterState.sample_type}
        onChange={handleChange}
        options={SAMPLE_TYPE_CHOICES}
        optionValue={(option) => option.id}
        optionLabel={(option) => option.text}
        labelClassName="text-sm"
        errorClassName="hidden"
      />

      <div className="w-full flex-none">
        <FieldLabel className="text-sm">Facility</FieldLabel>
        <div>
          {isFacilityLoading ? (
            <CircularProgress />
          ) : (
            <FacilitySelect
              multiple={false}
              name="facility"
              selected={filterState.facility_ref}
              showAll={true}
              setSelected={(obj) =>
                setFilterState({
                  facility: (obj as FacilityModel)?.id,
                  facility_ref: obj,
                })
              }
              errors={""}
            />
          )}
        </div>
      </div>
    </FiltersSlideover>
  );
}
