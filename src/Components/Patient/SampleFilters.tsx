import { useState, useEffect } from "react";
import { LegacySelectField } from "../Common/HelperInputFields";
import {
  SAMPLE_TEST_STATUS,
  SAMPLE_TEST_RESULT,
  SAMPLE_TYPE_CHOICES,
} from "../../Common/constants";
import { navigate } from "raviger";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { getAnyFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { CircularProgress } from "@material-ui/core";
import useMergeState from "../../Common/hooks/useMergeState";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";

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

  useEffect(() => {
    setFilterState(filter);
  }, [filter]);

  const handleChange = (event: any) => {
    const { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
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
      <div className="w-full flex-none">
        <div className="text-sm font-semibold">Status</div>
        <LegacySelectField
          name="status"
          variant="outlined"
          margin="dense"
          value={filterState.status || 0}
          options={[
            { id: "", text: "SELECT" },
            ...SAMPLE_TEST_STATUS.map(({ id, text }) => {
              return { id, text: text.replaceAll("_", " ") };
            }),
          ]}
          onChange={handleChange}
          errors=""
        />
      </div>

      <div className="w-full flex-none">
        <div className="text-sm font-semibold">Result</div>
        <LegacySelectField
          name="result"
          variant="outlined"
          margin="dense"
          value={filterState.result || 0}
          options={[{ id: "", text: "SELECT" }, ...SAMPLE_TEST_RESULT]}
          onChange={handleChange}
          errors=""
        />
      </div>

      <div className="w-full flex-none">
        <div className="text-sm font-semibold">Sample Test Type</div>
        <LegacySelectField
          name="sample_type"
          variant="outlined"
          margin="dense"
          value={filterState.sample_type}
          options={[{ id: "", text: "SELECT" }, ...SAMPLE_TYPE_CHOICES]}
          onChange={handleChange}
          errors=""
        />
      </div>

      <div className="w-full flex-none">
        <span className="text-sm font-semibold">Facility</span>
        <div className="">
          {isFacilityLoading ? (
            <CircularProgress size={20} />
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
              className="shifting-page-filter-dropdown"
              errors={""}
            />
          )}
        </div>
      </div>
    </FiltersSlideover>
  );
}
