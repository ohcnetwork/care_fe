import { navigate } from "raviger";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import FiltersSlideover from "@/CAREUI/interactive/FiltersSlideover";
import {
  SAMPLE_TEST_STATUS,
  SAMPLE_TEST_RESULT,
  SAMPLE_TYPE_CHOICES,
} from "@/Common/constants";
import useMergeState from "@/Common/hooks/useMergeState";
import CircularProgress from "@/Components/Common/components/CircularProgress";
import { FacilitySelect } from "@/Components/Common/FacilitySelect";
import { FacilityModel } from "@/Components/Facility/models";
import { FieldLabel } from "@/Components/Form/FormFields/FormField";
import { SelectFormField } from "@/Components/Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "@/Components/Form/FormFields/Utils";
import { getAnyFacility } from "@/Redux/actions";

const clearFilterState = {
  status: "",
  result: "",
  facility: "",
  facility_ref: null,
  sample_type: "",
};

export default function UserFilter(props: any) {
  const { filter, onChange, closeFilter } = props;

  const [filterState, setFilterState] = useMergeState({
    status: filter.status || "",
    result: filter.result || "",
    facility: filter.facility || "",
    facility_ref: filter.facility_ref || null,
    sample_type: filter.sample_type || "",
  });

  const [isFacilityLoading, setFacilityLoading] = useState(false);
  const dispatch: any = useDispatch();

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

  useEffect(() => {
    async function fetchData() {
      if (filter.facility) {
        setFacilityLoading(true);
        const { data: facilityData } = await dispatch(
          getAnyFacility(filter.facility, "facility")
        );
        setFilterState({ ...filterState, facility_ref: facilityData });
        setFacilityLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  console.log(filterState.sample_type);

  return (
    <FiltersSlideover
      advancedFilter={props}
      onApply={applyFilter}
      onClear={() => {
        navigate("/sample");
        setFilterState(clearFilterState);
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
